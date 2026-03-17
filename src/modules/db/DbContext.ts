declare const brand: unique symbol;

export type DbContext = { readonly [brand]: never };
