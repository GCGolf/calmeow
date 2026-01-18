/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const createSafeClient = () => {
    if (supabaseUrl && supabaseAnonKey) {
        return createClient(supabaseUrl, supabaseAnonKey)
    } else {
        console.warn('Supabase credentials missing. Using persistent local storage mock.');


        // --- Helper to access LocalStorage "Database" ---
        const getDB = () => {
            try {
                const stored = localStorage.getItem('neko_profiles');
                return stored ? JSON.parse(stored) : [];
            } catch { return []; }
        };

        const saveDB = (data: any[]) => {
            localStorage.setItem('neko_profiles', JSON.stringify(data));
        };

        // --- Mock Client Implementation ---
        return {
            from: (table: string) => ({
                // SELECT Operation
                select: (columns: string = '*') => {
                    let filters: Record<string, any> = {};
                    let limitVal: number | null = null;

                    const chain = {
                        eq: (column: string, value: any) => {
                            filters[column] = value;
                            return chain;
                        },
                        limit: (n: number) => {
                            limitVal = n;
                            return chain;
                        },
                        single: async () => {
                            const db = getDB();
                            let result = db;

                            // Apply Filters
                            Object.keys(filters).forEach(key => {
                                result = result.filter((item: any) => item[key] === filters[key]);
                            });

                            // Handle Single/Limit
                            // If trying to get specific user but not found, return null (simulating DB)
                            if (result.length === 0) return { data: null, error: { message: 'Not found' } };

                            const data = result[0];
                            return { data, error: null };
                        }
                    };
                    return chain;
                },

                // UPSERT Operation
                upsert: async (updates: any[]) => {
                    const db = getDB();
                    updates.forEach(updateItem => {
                        const index = db.findIndex((item: any) => item.id === updateItem.id);
                        if (index >= 0) {
                            db[index] = { ...db[index], ...updateItem };
                        } else {
                            db.push(updateItem);
                        }
                    });
                    saveDB(db);
                    return { data: updates, error: null };
                }
            }),
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            }
        } as any
    }
}

export const supabase = createSafeClient()
