// client/src/pages/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function TeacherDashboard() {
    const { lang } = useLang();
    const isEn = lang === 'en';

    const [summary, setSummary] = useState({
        questionCount: 0,
        testCount: 0
    });
    const [tests, setTests] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [qRes, tRes] = await Promise.all([
                    api.get('/questions'),
                    api.get('/tests')
                ]);
                setSummary({
                    questionCount: qRes.data.length,
                    testCount: tRes.data.length
                });
                setTests(tRes.data);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    const handleCopyLink = (testId) => {
        const link = `${window.location.origin}/take/${testId}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(link)
                .then(() => {
                    alert(
                        isEn
                            ? 'Test link copied to clipboard.'
                            : 'Đã sao chép link làm bài vào clipboard.'
                    );
                })
                .catch(() => {
                    window.prompt(
                        isEn
                            ? 'Copy this link and send it to students:'
                            : 'Sao chép đường link này rồi gửi cho học sinh:',
                        link
                    );
                });
        } else {
            window.prompt(
                isEn
                    ? 'Copy this link and send it to students:'
                    : 'Sao chép đường link này rồi gửi cho học sinh:',
                link
            );
        }
    };

    const handleDeleteTest = async (testId) => {
        const confirmMsg = isEn
            ? 'Are you sure you want to delete this test? All related results will be removed.'
            : 'Bạn có chắc chắn muốn xóa đề này? Tất cả kết quả liên quan cũng sẽ bị xóa.';

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/tests/${testId}`);
            setTests((prev) => prev.filter((t) => t.id !== testId));
            alert(
                isEn
                    ? 'Test has been deleted.'
                    : 'Đề kiểm tra đã được xóa.'
            );
        } catch (e) {
            console.error(e);
            alert(
                isEn
                    ? 'Failed to delete test.'
                    : 'Không xóa được đề kiểm tra.'
            );
        }
    };

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Teacher Dashboard' : 'Tổng quan giáo viên'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'Manage your question bank, create tests, and track student performance in one place.'
                    : 'Quản lý ngân hàng câu hỏi, tạo đề kiểm tra và theo dõi kết quả học sinh trên cùng một màn hình.'}
            </p>

            {/* Summary cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-2">
                                {isEn ? 'Question Bank' : 'Ngân hàng câu hỏi'}
                            </h5>
                            <p className="card-text text-muted small">
                                {isEn
                                    ? 'Store and organize questions by subject, topic, and difficulty. Reuse them across multiple tests.'
                                    : 'Lưu trữ, phân loại câu hỏi theo môn học, chủ đề, độ khó và tái sử dụng cho nhiều đề khác nhau.'}
                            </p>
                            <p className="mb-2">
                                {isEn ? 'Total questions:' : 'Tổng số câu hỏi:'}{' '}
                                <strong>{summary.questionCount}</strong>
                            </p>
                            <Link to="/questions" className="btn btn-sm btn-primary">
                                {isEn ? 'Manage questions' : 'Quản lý câu hỏi'}
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-2">
                                {isEn ? 'Create & assign tests' : 'Tạo đề & giao bài'}
                            </h5>
                            <p className="card-text text-muted small">
                                {isEn
                                    ? 'Quickly build tests from your question bank, set duration and time window, then share the link with students.'
                                    : 'Tạo đề nhanh từ ngân hàng câu hỏi, thiết lập thời lượng, thời gian mở/đóng và chia sẻ cho học sinh làm trực tuyến.'}
                            </p>
                            <p className="mb-2">
                                {isEn ? 'Tests created:' : 'Đã tạo:'}{' '}
                                <strong>{summary.testCount}</strong>{' '}
                                {isEn ? 'tests' : 'đề'}
                            </p>
                            <Link to="/tests/create" className="btn btn-sm btn-primary">
                                {isEn ? 'Create new test' : 'Tạo đề mới'}
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-2">
                                {isEn ? 'Results & analytics' : 'Kết quả & phân tích điểm'}
                            </h5>
                            <p className="card-text text-muted small">
                                {isEn
                                    ? 'View scores, score distribution charts, and monitor student progress over time.'
                                    : 'Xem điểm, biểu đồ phân bố, theo dõi tiến bộ của từng học sinh và cả lớp theo thời gian.'}
                            </p>
                            <Link to="/results" className="btn btn-sm btn-primary">
                                {isEn ? 'View results' : 'Xem kết quả'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test list */}
            <h5 className="mb-2 mt-3">
                {isEn ? 'Created tests' : 'Danh sách đề đã tạo'}
            </h5>
            <p className="text-muted small">
                {isEn
                    ? 'Each test has a unique Test Code (ID) and a test link. You can reuse the same test for different classes and sessions by sharing this code or link.'
                    : 'Mỗi đề có một Mã đề (ID) và link làm bài. Giáo viên có thể dùng lại đề này cho nhiều lớp, nhiều đợt kiểm tra khác nhau chỉ bằng cách gửi lại Mã đề hoặc link cho học sinh.'}
            </p>

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th>{isEn ? 'Test Code' : 'Mã đề'}</th>
                                <th>{isEn ? 'Title' : 'Tên đề'}</th>
                                <th>{isEn ? 'Duration' : 'Thời lượng'}</th>
                                <th>{isEn ? 'Total marks' : 'Tổng điểm'}</th>
                                <th>{isEn ? 'Created at' : 'Ngày tạo'}</th>
                                <th style={{ width: 200 }}>
                                    {isEn ? 'Actions' : 'Thao tác'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-3">
                                        {isEn
                                            ? 'No tests yet. Create your first test from the question bank.'
                                            : 'Chưa có đề nào. Hãy tạo đề mới từ ngân hàng câu hỏi.'}
                                    </td>
                                </tr>
                            )}
                            {tests.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <code>{t.id}</code>
                                    </td>
                                    <td>{t.title}</td>
                                    <td>
                                        {t.duration_minutes}{' '}
                                        {isEn ? 'minutes' : 'phút'}
                                    </td>
                                    <td>{t.total_marks}</td>
                                    <td>
                                        {t.created_at
                                            ? new Date(t.created_at).toLocaleString()
                                            : '—'}
                                    </td>
                                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                                        <Link
                                            to={`/tests/edit/${t.id}`}
                                            className="btn btn-sm btn-outline-secondary me-1"
                                        >
                                            {isEn ? 'Edit' : 'Sửa'}
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => handleCopyLink(t.id)}
                                        >
                                            {isEn ? 'Copy link' : 'Sao chép link'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger me-1"
                                            onClick={() => handleDeleteTest(t.id)}
                                        >
                                            {isEn ? 'Delete' : 'Xóa'}
                                        </button>
                                        <Link to="/results" className="btn btn-sm btn-link">
                                            {isEn ? 'View stats' : 'Xem thống kê'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-muted small mt-2">
                {isEn
                    ? '* To reuse a test, simply keep its Test Code or link and share it again with another class or exam session.'
                    : '* Khi muốn tái sử dụng đề, giáo viên chỉ cần giữ lại Mã đề hoặc link làm bài và gửi lại cho lớp khác hoặc ca thi khác.'}
            </p>
        </div>
    );
}

export default TeacherDashboard;
