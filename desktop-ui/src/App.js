import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Platforms } from "./pages/Platforms.js";
import { Users } from "./pages/Users.js";
import { Chat } from "./pages/Chat.js";
import { Actions } from "./pages/Actions.js";
import { Health } from "./pages/Health.js";
import { Settings } from "./pages/Settings.js";
import { Workspaces } from "./pages/Workspaces.js";
import { CustomTools } from "./pages/CustomTools.js";
const App = () => {
    return (_jsx(Router, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/platforms", element: _jsx(Platforms, {}) }), _jsx(Route, { path: "/users", element: _jsx(Users, {}) }), _jsx(Route, { path: "/chat", element: _jsx(Chat, {}) }), _jsx(Route, { path: "/actions", element: _jsx(Actions, {}) }), _jsx(Route, { path: "/health", element: _jsx(Health, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/workspaces", element: _jsx(Workspaces, {}) }), _jsx(Route, { path: "/custom-tools", element: _jsx(CustomTools, {}) })] }) }) }));
};
export default App;
//# sourceMappingURL=App.js.map