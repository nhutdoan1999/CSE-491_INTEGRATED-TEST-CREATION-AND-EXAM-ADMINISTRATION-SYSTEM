// client/src/pages/ResultsPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLang } from '../langContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ResultsPage({ user }) {
    const { lang } = useLang();
    const isEn = lang === 'en';
    const isTeacher = user?.role === 'teacher';

    const [tests, setTests] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [summary, setSummary] = useState(null);
    const [myResults, setMyResults] = useState([]);

    // Phần review cho học sinh
    const [review, setReview] = useState(null);
    const [reviewTestId, setReviewTestId] = useState(null);
    const [loadingReview, setLoadingReview] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                if (isTeacher) {
                    const tRes = await api.get('/tests');
                    setTests(tRes.data);
                } else {
                    const rRes = await api.get('/results/my');
                    setMyResults(rRes.data);
                }
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [isTeacher]);

    const handleSelectTest = async (e) => {
        const id = e.target.value;
        setSelectedTestId(id);
        setSummary(null);

        if (!id) {
            return;
        }
        try {
            const res = await api.get(`/results/summary/${id}`);
            setSummary(res.data);
        } catch (e) {
            console.error(e);
            setSummary(null);
        }
    };

    // Học sinh bấm "Review" ở bảng kết quả
    const handleLoadReview = async (resultId) => {
        if (!resultId) return;
        setLoadingReview(true);
        setReview(null);
        setReviewTestId(resultId);
        try {
            const res = await api.get(`/results/review/${resultId}`);
            setReview(res.data);
        } catch (e) {
            console.error(e);
            alert(
                isEn
                    ? 'Cannot load review for this test.'
                    : 'Không tải được phần xem lại của lần nộp này.'
            );
        } finally {
            setLoadingReview(false);
        }
    };

    // ======= STUDENT VIEW =======
    if (!isTeacher) {
        return (
            <div>
                <h4 className="page-title">
                    {isEn ? 'My results' : 'Kết quả của tôi'}
                </h4>
                <p className="page-subtitle">
                    {isEn
                        ? 'List of tests you have submitted and the corresponding scores. You can review your answers for each test.'
                        : 'Danh sách các bài kiểm tra bạn đã nộp và điểm số tương ứng. Bạn có thể xem lại đáp án cho từng đề.'}
                </p>
                <div className="card shadow-sm mb-3">
                    <div className="card-body p-0">
                        <table className="table mb-0">
                            <thead>
                                <tr>
                                    <th>{isEn ? 'Test' : 'Đề'}</th>
                                    <th>{isEn ? 'Score' : 'Điểm'}</th>
                                    <th>{isEn ? 'Max score' : 'Điểm tối đa'}</th>
                                    <th>{isEn ? 'Submitted at' : 'Thời gian nộp'}</th>
                                    <th className="text-end">
                                        {isEn ? 'Actions' : 'Thao tác'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {myResults.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-3">
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
                                        <td className="text-end">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleLoadReview(r.id)}  // <-- dùng result.id
                                            >
                                                {isEn ? 'Review answers' : 'Xem lại đáp án'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Khối hiển thị review ở dưới bảng */}
                {loadingReview && (
                    <p className="text-muted">
                        {isEn ? 'Loading review...' : 'Đang tải phần xem lại...'}
                    </p>
                )}

                {review && (
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="mb-1">
                                {isEn ? 'Answer review' : 'Xem lại đáp án'}
                            </h5>
                            <p className="text-muted small mb-3">
                                {isEn
                                    ? `Test: ${review.test.title} · Score: ${review.result.score}/${review.result.maxScore}`
                                    : `Đề: ${review.test.title} · Điểm: ${review.result.score}/${review.result.maxScore}`}
                            </p>

                            {review.questions.map((q, idx) => (
                                <div key={q.id} className="mb-3 p-2 border rounded">
                                    <div className="fw-semibold mb-1">
                                        {isEn ? 'Question' : 'Câu'} {idx + 1}. {q.content}
                                    </div>
                                    <div className="small mb-1">
                                        <span className="me-1">
                                            {isEn
                                                ? 'Your answer:'
                                                : 'Câu trả lời của bạn:'}
                                        </span>
                                        <span
                                            className={
                                                q.isCorrect ? 'text-success' : 'text-danger'
                                            }
                                        >
                                            {q.studentAnswer != null && q.studentAnswer !== ''
                                                ? String(q.studentAnswer)
                                                : isEn
                                                    ? '(No answer)'
                                                    : '(Không trả lời)'}
                                        </span>
                                    </div>
                                    <div className="small mb-1">
                                        {isEn ? 'Correct answer:' : 'Đáp án đúng:'}{' '}
                                        <span className="text-success">
                                            {q.correctAnswer != null && q.correctAnswer !== ''
                                                ? String(q.correctAnswer)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="small text-muted">
                                        {isEn ? 'Marks:' : 'Điểm:'} {q.gainedPoints} / {q.points}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ======= TEACHER VIEW =======

    const chartData =
        summary && summary.results.length > 0
            ? {
                labels: summary.results.map(
                    (r) => r.student_name || `HS ${r.student_id}`
                ),
                datasets: [
                    {
                        label: isEn ? 'Score' : 'Điểm',
                        data: summary.results.map((r) => r.score)
                    }
                ]
            }
            : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: isEn ? 'Class score distribution' : 'Phân bố điểm của lớp'
            }
        }
    };

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Results & analytics' : 'Kết quả & thống kê'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'Select a test to see the number of submissions, average score and score distribution for your class.'
                    : 'Chọn một đề kiểm tra để xem số lượng bài nộp, điểm trung bình và phân bố điểm của học sinh.'}
            </p>

            <div className="mb-3">
                <label className="form-label">
                    {isEn
                        ? 'Select a test to view statistics'
                        : 'Chọn đề kiểm tra để xem thống kê'}
                </label>
                <select
                    className="form-select"
                    value={selectedTestId}
                    onChange={handleSelectTest}
                >
                    <option value="">
                        {isEn ? '-- Select test --' : '-- Chọn đề --'}
                    </option>
                    {tests.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.title}
                        </option>
                    ))}
                </select>
            </div>

            {summary && (
                <>
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="text-muted small">
                                        {isEn ? 'Submissions' : 'Số bài đã nộp'}
                                    </div>
                                    <div className="h4 mb-0">
                                        {summary.stats.totalAttempts}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="text-muted small">
                                        {isEn ? 'Average score' : 'Điểm trung bình'}
                                    </div>
                                    <div className="h4 mb-0">
                                        {summary.stats.avgScore.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="text-muted small">
                                        {isEn ? 'Highest score' : 'Điểm cao nhất'}
                                    </div>
                                    <div className="h4 mb-0">
                                        {summary.stats.best}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="text-muted small">
                                        {isEn ? 'Lowest score' : 'Điểm thấp nhất'}
                                    </div>
                                    <div className="h4 mb-0">
                                        {summary.stats.worst}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {chartData && (
                        <div className="card mb-3 shadow-sm">
                            <div className="card-body">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <table className="table mb-0">
                                <thead>
                                    <tr>
                                        <th>{isEn ? 'Student' : 'Học sinh'}</th>
                                        <th>{isEn ? 'Score' : 'Điểm'}</th>
                                        <th>{isEn ? 'Submitted at' : 'Thời gian nộp'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.results.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.student_name}</td>
                                            <td>{r.score}</td>
                                            <td>{new Date(r.submitted_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!summary && selectedTestId && (
                <p className="text-muted">
                    {isEn
                        ? 'No results yet for this test.'
                        : 'Chưa có kết quả nào cho đề kiểm tra này.'}
                </p>
            )}
        </div>
    );
}

export default ResultsPage;
