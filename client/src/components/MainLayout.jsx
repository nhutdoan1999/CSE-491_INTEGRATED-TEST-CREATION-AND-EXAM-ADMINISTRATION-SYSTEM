// client/src/components/MainLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiDatabase, FiEdit, FiBarChart2 } from 'react-icons/fi';
import { useLang } from '../langContext';

function MainLayout({ user, onLogout }) {
    const { lang, setLang } = useLang();
    const isEn = lang === 'en';
    const isTeacher = user?.role === 'teacher';

    return (
        <div className="vh-100 d-flex flex-column app-shell">
            {/* Top bar */}
            <nav className="navbar navbar-expand app-navbar shadow-sm px-3">
                <div className="d-flex align-items-center">
                    <div className="app-logo me-2">
                        <span>ST</span>
                    </div>
                    <div className="d-flex flex-column">
                        <span className="app-logo-text">SmartTest</span>
                        <span className="app-logo-subtext">
                            {isEn
                                ? 'Integrated test creation & exam management'
                                : 'Nền tảng tạo đề & giao bài trực tuyến'}
                        </span>
                    </div>
                </div>

                <div className="ms-auto d-flex align-items-center gap-3">
                    {/* Language switcher */}
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

                    <div className="text-end small">
                        <div className="fw-semibold">
                            {isEn ? (isTeacher ? 'Teacher' : 'Student') : isTeacher ? 'Giáo viên' : 'Học sinh'}
                            {': '}
                            {user?.name}
                        </div>
                        <div className="opacity-75">{user?.email}</div>
                    </div>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onLogout}
                    >
                        {isEn ? 'Log out' : 'Đăng xuất'}
                    </button>
                </div>
            </nav>

            {/* Body */}
            <div className="flex-fill d-flex">
                {/* Sidebar */}
                <div className="border-end sidebar">
                    <div className="p-3">
                        <div className="sidebar-header mb-2">
                            {isEn ? 'Dashboard' : 'Bảng điều khiển'}
                        </div>
                        <ul className="nav flex-column gap-1">
                            <li className="nav-item">
                                <NavLink
                                    end
                                    to="/"
                                    className={({ isActive }) =>
                                        'nav-link d-flex align-items-center gap-2' +
                                        (isActive ? ' active' : '')
                                    }
                                >
                                    <FiHome size={16} />
                                    <span>{isEn ? 'Overview' : 'Trang tổng quan'}</span>
                                </NavLink>
                            </li>

                            {isTeacher && (
                                <>
                                    <li className="nav-item">
                                        <NavLink
                                            to="/questions"
                                            className={({ isActive }) =>
                                                'nav-link d-flex align-items-center gap-2' +
                                                (isActive ? ' active' : '')
                                            }
                                        >
                                            <FiDatabase size={16} />
                                            <span>
                                                {isEn ? 'Question Bank' : 'Ngân hàng câu hỏi'}
                                            </span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink
                                            to="/tests/create"
                                            className={({ isActive }) =>
                                                'nav-link d-flex align-items-center gap-2' +
                                                (isActive ? ' active' : '')
                                            }
                                        >
                                            <FiEdit size={16} />
                                            <span>
                                                {isEn ? 'Create & assign tests' : 'Tạo đề & giao bài'}
                                            </span>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            <li className="nav-item">
                                <NavLink
                                    to="/results"
                                    className={({ isActive }) =>
                                        'nav-link d-flex align-items-center gap-2' +
                                        (isActive ? ' active' : '')
                                    }
                                >
                                    <FiBarChart2 size={16} />
                                    <span>
                                        {isEn ? 'Results & analytics' : 'Kết quả & thống kê'}
                                    </span>
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-fill p-4" style={{ overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default MainLayout;
