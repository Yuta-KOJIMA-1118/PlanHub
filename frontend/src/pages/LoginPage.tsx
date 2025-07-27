// src/pages/LoginPage.tsx
import LoginForm from '../components/LoginForm'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div>
      <h1>ログイン</h1>
      <LoginForm />
      <p>
        アカウントをお持ちでない方は <Link to="/register">新規登録</Link>
      </p>
    </div>
  )
}
