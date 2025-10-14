import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Refine, Authenticated } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { ThemedLayoutV2, ErrorComponent, notificationProvider } from "@refinedev/antd";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// We'll start MSW in development and await the worker to be ready before
// mounting the React app so all initial requests are intercepted.

import { resolveDataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import { ResourceList } from "./pages/resource-list";
import { LoginPage } from "./pages/login";
import { RouteDebugger } from "./components/route-debugger";
import { StudentsCreate } from "./pages/students-create";
import { StudentsEdit } from "./pages/students-edit";
import { TeachersCreate } from "./pages/teachers-create";
import { ClassesCreate } from "./pages/classes-create";
import { SubjectsCreate } from "./pages/subjects-create";

import "@refinedev/antd/dist/reset.css";
import "antd/dist/reset.css";

// render app after optional mock bootstrap (below)

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

const dataProvider = resolveDataProvider();

// Feature flag untuk mematikan layout kustom via env
const disableCustomLayout = import.meta.env.VITE_DISABLE_CUSTOM_LAYOUT === "true";
if (disableCustomLayout) {
  console.info("[Layout] Custom layout disabled. Using plain router outlet.");
}

// Pastikan Outlet selalu dirender baik saat pakai ThemedLayoutV2 maupun plain
const LayoutWrapper: React.FC = () =>
  disableCustomLayout ? (
    <Outlet />
  ) : (
    <ThemedLayoutV2>
      <Outlet />
    </ThemedLayoutV2>
  );

async function bootstrap() {
  if (import.meta.env.DEV) {
    try {
      // prefer a start helper if present, otherwise call worker.start()
      // @ts-ignore
      const mswMod = await import("./mocks/browser");
      if (typeof (mswMod as any).startWorker === "function") {
        await (mswMod as any).startWorker({ onUnhandledRequest: "bypass" });
      } else if ((mswMod as any).worker && typeof (mswMod as any).worker.start === "function") {
        await (mswMod as any).worker.start({ onUnhandledRequest: "bypass" });
      } else if (
        (mswMod as any).default?.worker &&
        typeof (mswMod as any).default.worker.start === "function"
      ) {
        await (mswMod as any).default.worker.start({ onUnhandledRequest: "bypass" });
      } else {
        // eslint-disable-next-line no-console
        console.warn("MSW: couldn't find a start entry on ./mocks/browser", Object.keys(mswMod));
      }
      // eslint-disable-next-line no-console
      console.info("MSW bootstrap complete (dev)");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("MSW failed to start:", err instanceof Error ? err.message : String(err));
    }
  }

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
                        <LayoutWrapper />
                      </Authenticated>
                    }
                  >
                    <Route index element={<NavigateToResource resource={resources[0].name} />} />
                    {resources.map((resource) => (
                      <Route key={resource.name} path={resource.name}>
                        <Route index element={<ResourceList />} />
                        {/* Resource-specific pages (some implemented) */}
                        {resource.name === "students" && (
                          <>
                            <Route path="create" element={<StudentsCreate />} />
                            <Route path=":id" element={<StudentsEdit />} />
                          </>
                        )}
                        {resource.name === "teachers" && (
                          <Route path="create" element={<TeachersCreate />} />
                        )}
                        {resource.name === "classes" && (
                          <Route path="create" element={<ClassesCreate />} />
                        )}
                        {resource.name === "subjects" && (
                          <Route path="create" element={<SubjectsCreate />} />
                        )}
                      </Route>
                    ))}
                  </Route>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<ErrorComponent />} />
                </Routes>

                <DocumentTitleHandler />
                <UnsavedChangesNotifier />
                <RouteDebugger />
              </Refine>
            </AntdApp>
          </ConfigProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

void bootstrap();
