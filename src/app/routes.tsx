import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Medicines } from "./pages/Medicines";
import { Transactions } from "./pages/Transactions";
import { Stock } from "./pages/Stock";
import { Reports } from "./pages/Reports";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "medicines", Component: Medicines },
          { path: "transactions", Component: Transactions },
          { path: "stock", Component: Stock },
          { path: "reports", Component: Reports },
        ],
      },
    ],
  },
]);
