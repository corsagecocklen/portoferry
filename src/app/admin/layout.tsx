import type { Metadata } from "next";

import "./admin.css";

export const metadata: Metadata = {
  title: { absolute: "Admin | Portoferry" },
  description: "Panel pengelolaan proyek Portoferry.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-route">{children}</div>;
}
