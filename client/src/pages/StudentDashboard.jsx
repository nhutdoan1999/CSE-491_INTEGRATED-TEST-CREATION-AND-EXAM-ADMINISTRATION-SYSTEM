// client/src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function StudentDashboard() {
    const { lang } = useLang();
    const isEn = lang === 'en';

    const [tests, setTests] = useState([]);
    const [myResults, setMyResults] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [tRes, rRes] = await Promise.all([
                    api.get('/tests'),
                    api.get('/results/my')
                ]);
                setTests(tRes.data);
                setMyResults(rRes.data);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Student Dashboard' : 'Bảng điều khiển học sinh'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'See available tests, take them online, and track your learning progress.'
                    : 'Xem các bài kiểm tra đang mở, làm bài trực tuyến và theo dõi kết quả học tập của bạn.'}
            </p>

            <h5 className="mb-2">
                {isEn ? 'Available tests' : 'Bài kiểm tra đang mở'}
            </h5>
            <div className="card mb-4 shadow-sm">
                <div className="card-body p-0">
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th>{isEn ? 'Test title' : 'Tên đề'}</th>
                                <th>{isEn ? 'Teacher' : 'Giáo viên'}</th>
                                <th>{isEn ? 'Duration' : 'Thời lượng'}</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {tests.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-3">
                                        {isEn
                                            ? 'There are no open tests at the moment.'
                                            : 'Hiện chưa có bài kiểm tra nào được mở.'}
                                    </td>
                                </tr>
                            )}
                            {tests.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.title}</td>
                                    <td>{t.teacher_name || '—'}</td>
                                    <td>
                                        {t.duration_minutes}{' '}
                                        {isEn ? 'minutes' : 'phút'}
                                    </td>
                                    <td className="text-end">
                                        <Link
                                            to={`/take/${t.id}`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            {isEn ? 'Start test' : 'Vào làm bài'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <h5 className="mb-2">
                {isEn ? 'Recent results' : 'Kết quả gần đây'}
            </h5>
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th>{isEn ? 'Test' : 'Đề'}</th>
                                <th>{isEn ? 'Score' : 'Điểm'}</th>
                                <th>{isEn ? 'Max score' : 'Điểm tối đa'}</th>
                                <th>{isEn ? 'Submitted at' : 'Thời gian nộp'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myResults.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-3">
                                        {isEn
                                            ? 'You have not submitted any tests yet.'
                                            : 'Bạn chưa có bài kiểm tra nào đã nộp.'}
                                    </td>
                                </tr>
                            )}
                            {myResults.map((r) => (
                                <tr key={r.id}>
                                    <td>{r.title}</td>
                                    <td>{r.score}</td>
                                    <td>{r.total_marks}</td>
                                    <td>{new Date(r.submitted_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
