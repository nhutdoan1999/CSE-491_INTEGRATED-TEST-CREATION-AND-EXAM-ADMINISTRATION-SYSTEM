// client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const { lang, setLang } = useLang();
    const isEn = lang === 'en';

    const [mode, setMode] = useState('login'); // login | register
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'teacher'
    });
    const [error, setError] = useState('');

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            let res;
            if (mode === 'login') {
                res = await api.post('/auth/login', {
                    email: form.email.trim(),
                    password: form.password
                });
            } else {
                res = await api.post('/auth/register', {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    role: form.role
                });
            }
            onLogin(res.data);
            navigate('/');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                (isEn
                    ? 'An error occurred. Please check your information.'
                    : 'Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin.')
            );
        }
    };

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center login-page">
            <div className="card shadow-sm login-card">
                <div className="card-body p-4">
                    {/* Language switch on login */}
                    <div className="d-flex justify-content-end mb-2">
                        <div className="lang-toggle">
                            <button
                                type="button"
                                className={isEn ? 'active' : ''}
                                onClick={() => setLang('en')}
                            >
                                EN
                            </button>
                            <button
                                type="button"
                                className={!isEn ? 'active' : ''}
                                onClick={() => setLang('vi')}
                            >
                                VI
                            </button>
                        </div>
                    </div>

                    {/* Logo + Brand */}
                    <div className="login-logo-wrapper mb-3 text-center">
                        <div className="app-logo app-logo-lg mx-auto mb-2">
                            <span>ST</span>
                        </div>
                        <div className="login-brand-main">SmartTest</div>
                        <div className="login-brand-sub">
                            {isEn
                                ? 'Integrated test creation & exam management system'
                                : 'Hệ thống tạo đề & quản lý kiểm tra trực tuyến'}
                        </div>
                    </div>

                    {/* <div className="text-center mb-3 small text-muted">
                        {isEn
                            ? 'Sign in with a teacher or student account to get started.'
                            : 'Đăng nhập bằng tài khoản giáo viên hoặc học sinh để bắt đầu.'}
                    </div> */}

                    <div className="btn-group w-100 mb-3">
                        <button
                            type="button"
                            className={
                                'btn btn-sm ' +
                                (mode === 'login' ? 'btn-primary' : 'btn-outline-primary')
                            }
                            onClick={() => setMode('login')}
                        >
                            {isEn ? 'Log in' : 'Đăng nhập'}
                        </button>
                        <button
                            type="button"
                            className={
                                'btn btn-sm ' +
                                (mode === 'register' ? 'btn-primary' : 'btn-outline-primary')
                            }
                            onClick={() => setMode('register')}
                        >
                            {isEn ? 'Create account' : 'Đăng ký tài khoản'}
                        </button>
                    </div>

                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <>
                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Full name' : 'Họ và tên'}{' '}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="name"
                                        value={form.name}
                                        onChange={onChange}
                                        required={mode === 'register'}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Role' : 'Vai trò'}
                                    </label>
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={form.role}
                                        onChange={onChange}
                                    >
                                        <option value="teacher">
                                            {isEn ? 'Teacher' : 'Giáo viên'}
                                        </option>
                                        <option value="student">
                                            {isEn ? 'Student' : 'Học sinh'}
                                        </option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="mb-2">
                            <label className="form-label">
                                {isEn ? 'Email' : 'Email'}{' '}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                required
                                placeholder={
                                    isEn ? 'e.g. teacher@school.edu' : 'vd: giaovien@truong.edu.vn'
                                }
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                {isEn ? 'Password' : 'Mật khẩu'}{' '}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={onChange}
                                required
                                minLength={4}
                            />
                        </div>

                        <button className="btn btn-primary w-100 mb-2" type="submit">
                            {mode === 'login'
                                ? isEn
                                    ? 'Log in'
                                    : 'Đăng nhập'
                                : isEn
                                    ? 'Create account'
                                    : 'Tạo tài khoản'}
                        </button>
                    </form>

                    <div className="small text-muted mt-2">
                        <div>
                            • {isEn
                                ? 'Teachers: create tests, assign them, and view statistics.'
                                : 'Giáo viên: tạo đề, giao bài, xem thống kê kết quả.'}
                        </div>
                        <div>
                            • {isEn
                                ? 'Students: take tests and track your scores.'
                                : 'Học sinh: làm bài kiểm tra và theo dõi điểm số của mình.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
