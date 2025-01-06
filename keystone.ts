import { config } from "@keystone-6/core";
import { lists } from "./schema";
import { withAuth, session } from "./auth";

export default withAuth(
  config({
    db: {
      provider: "mysql",
      url:
        process.env.DATABASE_URL ||
        "mysql://root:123456@localhost:3306/shopping_center_db",
      enableLogging: true,
      idField: { kind: "autoincrement" },
    },
    lists,
    session,
    ui: {
      isAccessAllowed: async (context) => {
        if (!context.session?.itemId) return false;

        try {
          const user = await context.query.User.findOne({
            where: { id: context.session.itemId },
            query: "role",
          });
          return user?.role === "admin" || user?.role === "client";
        } catch (e) {
          console.error("Error checking user access:", e);
          return false;
        }
      },
      publicPages: ["/collected-rents"],
      getAdditionalFiles: [
        async () => [{
          mode: "write",
          src: `import { jsx } from '@keystone-ui/core';
                export { default } from "@/src/admin/components/collected-rents-page";`,
          outputPath: "admin/pages/collected-rents.tsx",
        }],
      ],
    },
  })
);
