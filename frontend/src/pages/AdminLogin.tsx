import Layout from '@/components/layout/Layout';
import AuthForm from '@/components/auth/AuthForm';

const AdminLogin = () => {
  return (
    <Layout>
      <AuthForm mode="admin" />
    </Layout>
  );
};

export default AdminLogin;
