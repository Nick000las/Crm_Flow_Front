import { Navigate, Route, Routes } from 'react-router-dom';
import EmailLogin from '../modules/auth/pages/email-login';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<EmailLogin />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
