import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  float,
} from "@keystone-6/core/fields";

// Access control helpers
const isAdmin = ({ session }: { session?: { data?: { role?: string } } }) =>
  session?.data?.role === "admin";
const isClient = ({ session }: { session: { data?: { role?: string } } }) =>
  session?.data?.role === "client";
const isSignedIn = ({ session }: { session?: { data?: { role?: string } } }) =>
  !!session?.data;
const isNotAdmin = ({ session }: { session?: { data?: { role?: string } } }) =>
  session?.data?.role !== "admin";

// Define common access pattern for admin-only access
const adminOnlyAccess = {
  operation: {
    create: isAdmin,
    query: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
};

export const lists = {
  User: list({
    ui: {
      isHidden: (context) => !isAdmin(context)
    },
    access: {
      operation: {
        create: isAdmin,
        query: isSignedIn,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({
        validation: { isRequired: true },
        isIndexed: "unique",
      }),
      password: password({ validation: { isRequired: true } }),
      role: select({
        type: "string",
        options: [
          { label: "Admin", value: "admin" },
          { label: "Client", value: "client" },
        ],
        defaultValue: undefined,
        validation: { isRequired: false },
        ui: {
          displayMode: "select",
          createView: { fieldMode: "edit" },
        },
      }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
    },
  }),

  Mall: list({
    ui: {
      isHidden: (context) => !isAdmin(context)
    },
    access: {
      operation: {
        create: isAdmin,
        query: isSignedIn,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      city: text({ validation: { isRequired: true } }),
      address: text({ validation: { isRequired: true } }),
      stores: relationship({
        ref: "Store.mall",
        many: true,
      }),
    },
  }),

  Store: list({
    ui: {
      isHidden: (context) => !isAdmin(context)
    },
    access: {
      operation: {
        create: isAdmin,
        query: isSignedIn,
        update: isAdmin,
        delete: isAdmin,
      },
      filter: {
        query: ({ session, context }) => {
          if (isAdmin({ session })) return true;
          if (isClient({ session })) {
            return {
              client: {
                user: {
                  id: { equals: session.data.id },
                },
              },
            };
          }
          return false;
        },
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      floor: integer({ validation: { isRequired: true } }),
      mall: relationship({
        ref: "Mall.stores",
        many: false,
      }),
      client: relationship({
        ref: "Client.stores",
        many: false,
      }),
      payments: relationship({
        ref: "Payment.store",
        many: true,
      }),
    },
  }),

  Client: list({
    ui: {
      isHidden: (context) => !isAdmin(context)
    },
    access: {
      operation: {
        create: isAdmin,
        query: isSignedIn,
        update: isAdmin,
        delete: isAdmin,
      },
      filter: {
        query: ({ session }) => {
          if (isAdmin({ session })) return true;
          if (isClient({ session })) {
            return {
              user: {
                id: { equals: session.data.id },
              },
            };
          }
          return false;
        },
      },
    },
    fields: {
      user: relationship({
        ref: "User",
        many: false,
        ui: {
          hideCreate: true,
          linkToItem: true,
        },
      }),
      name: text({ validation: { isRequired: true } }),
      phoneNumber: text({ validation: { isRequired: true } }),
      stores: relationship({
        ref: "Store.client",
        many: true,
      }),
    },
  }),

  Payment: list({
    ui: {
      isHidden: false,
      hideDelete: ({ session }) => session?.data?.role !== "admin",
      hideCreate: false,
      itemView: {
        defaultFieldMode: ({ session }) =>
          session?.data?.role === "admin" ? "edit" : "read",
      },
    },
    access: {
      operation: {
        // Allow both admin and client to create payments
        create: ({ session }) => {
          if (!session?.data) return false;
          return (
            session.data.role === "admin" || session.data.role === "client"
          );
        },
        query: isSignedIn,
        update: isAdmin,
        delete: isAdmin,
      },
      filter: {
        query: ({ session }) => {
          if (!session?.data) return false;
          if (isAdmin({ session })) return true;
          if (session.data.role === "client") {
            return {
              store: {
                client: {
                  user: {
                    id: { equals: session.data.id },
                  },
                },
              },
            };
          }
          return false;
        },
      },
      item: {
        create: async ({ session, context, inputData }) => {
          if (!session?.data) return false;

          if (isAdmin({ session })) return true;

          if (session.data.role === "client") {
            // Check if the store belongs to the client
            const store = await context.query.Store.findOne({
              where: { id: inputData.store?.connect?.id ?? "" },
              query: "client { user { id } }",
            });

            return store?.client?.user?.id === session.data.id;
          }
          return false;
        },
      },
    },
    fields: {
      store: relationship({
        ref: "Store.payments",
        many: false,
      }),
      amount: float({ validation: { isRequired: true } }),
      currency: select({
        type: "string",
        options: [
          { label: "Turkish Lira", value: "TRY" },
          { label: "Euro", value: "EUR" },
          { label: "US Dollar", value: "USD" },
        ],
        validation: { isRequired: true },
        ui: {
          displayMode: "select",
        },
      }),
      date: timestamp({
        validation: { isRequired: true },
        defaultValue: { kind: "now" },
      }),
    },
  }),
} as const;
