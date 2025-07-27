import React, { useState } from 'react'
import axios from 'axios'

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        `${backendURL}/users`,
        {
          user: {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation
          }
        },
        { withCredentials: true } // Cookie対応
      )

      console.log('登録成功', response.data)
      alert('ユーザー登録が完了しました！')
      window.location.href = '/calendar'
    } catch (error: any) {
      console.error('登録失敗', error.response?.data || error.message)
      alert('ユーザー登録に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>名前:</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label>メールアドレス:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>パスワード:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <div>
        <label>パスワード確認:</label>
        <input
          type="password"
          value={passwordConfirmation}
          onChange={e => setPasswordConfirmation(e.target.value)}
          required
        />
      </div>
      <button type="submit">ユーザー登録</button>
    </form>
  )
}

export default RegisterForm
