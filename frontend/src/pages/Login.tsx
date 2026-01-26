import Layout from '@/components/layout/Layout';
import AuthForm from '@/components/auth/AuthForm';

const Login = () => {
  return (
    <Layout>
      <AuthForm mode="login" />
    </Layout>
  );
};

export default Login;
