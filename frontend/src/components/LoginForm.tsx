// src/components/LoginForm.tsx

import React, { useState } from 'react'
import axios from 'axios'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        `${backendURL}/users/sign_in`,
        {
          user: { email, password }
        },
        { withCredentials: true } // Cookieを有効にする
      )

      console.log('ログイン成功', response.data)
      // 例: カレンダー画面へ遷移
      window.location.href = '/calendar'
    } catch (error: any) {
      console.error('ログイン失敗', error.response?.data || error.message)
      alert('ログインに失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">ログイン</button>
    </form>
  )
}

export default LoginForm
