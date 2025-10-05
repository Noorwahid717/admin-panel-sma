import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Refine } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { ThemedLayoutV2, ErrorComponent, notificationProvider } from "@refinedev/antd";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import { ResourceList } from "./pages/resource-list";
import { LoginPage } from "./pages/login";
import { Authenticated } from "@refinedev/core";

import "@refinedev/antd/dist/reset.css";
import "antd/dist/reset.css";

const queryClient = new QueryClient();

const resources = [
  { name: "students", list: "/students", meta: { label: "Students" } },
  { name: "teachers", list: "/teachers", meta: { label: "Teachers" } },
  { name: "classes", list: "/classes", meta: { label: "Classes" } },
  { name: "subjects", list: "/subjects", meta: { label: "Subjects" } },
  { name: "terms", list: "/terms", meta: { label: "Terms" } },
  { name: "enrollments", list: "/enrollments", meta: { label: "Enrollments" } },
  { name: "grade-components", list: "/grade-components", meta: { label: "Grade Components" } },
  { name: "grades", list: "/grades", meta: { label: "Grades" } },
  { name: "attendance", list: "/attendance", meta: { label: "Attendance" } },
] as const;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#1d4ed8",
              borderRadius: 8,
            },
          }}
        >
          <AntdApp>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              notificationProvider={notificationProvider}
              routerProvider={routerProvider}
              resources={resources.map(({ name, list, meta }) => ({
                name,
                list,
                meta,
              }))}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: false,
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated key="authenticated-routes" fallback={<LoginPage />}>
                      <ThemedLayoutV2 />
                    </Authenticated>
                  }
                >
                  <Route index element={<NavigateToResource resource={resources[0].name} />} />
                  {resources.map((resource) => (
                    <Route key={resource.name} path={resource.name}>
                      <Route index element={<ResourceList />} />
                    </Route>
                  ))}
                </Route>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<ErrorComponent />} />
              </Routes>

              <DocumentTitleHandler />
              <UnsavedChangesNotifier />
            </Refine>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
