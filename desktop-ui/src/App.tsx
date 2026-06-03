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

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/platforms" element={<Platforms />} />
          <Route path="/users" element={<Users />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/health" element={<Health />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/custom-tools" element={<CustomTools />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
