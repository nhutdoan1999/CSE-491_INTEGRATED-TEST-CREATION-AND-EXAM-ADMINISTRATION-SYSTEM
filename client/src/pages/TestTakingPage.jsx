// client/src/pages/TestTakingPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function TestTakingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { lang } = useLang();
    const isEn = lang === 'en';

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    // Timer
    const [timeLeft, setTimeLeft] = useState(null);
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    // Review
    const [review, setReview] = useState(null);
    const [loadingReview, setLoadingReview] = useState(false);

    const formatTime = (seconds) => {
        if (seconds == null) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s
            .toString()
            .padStart(2, '0')}`;
    };

    // Load đề + câu hỏi
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.test);
                setQuestions(res.data.questions);

                // Khởi tạo timer dựa trên duration_minutes
                if (res.data.test && res.data.test.duration_minutes) {
                    setTimeLeft(res.data.test.duration_minutes * 60);
                }
            } catch (e) {
                alert(
                    isEn
                        ? 'Unable to load this test.'
                        : 'Không tải được bài kiểm tra.'
                );
                navigate('/');
            }
        };
        load();
    }, [id, navigate, isEn]);

    // Đếm ngược thời gian
    useEffect(() => {
        if (timeLeft == null) return; // chưa load xong
        if (result) return; // đã nộp bài -> dừng
        if (timeLeft <= 0) {
            // Hết giờ -> tự động nộp
            submitTest(true);
            return;
        }

        const timerId = setTimeout(() => {
            setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
        }, 1000);

        return () => clearTimeout(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, result]); // cố ý không thêm submitTest vào dependency để tránh lặp vô tận

    const updateAnswer = (qId, value) => {
        setAnswers((a) => ({ ...a, [qId]: value }));
    };

    // Hàm submit chung (auto = true khi auto nộp do hết giờ)
    const submitTest = async (auto = false) => {
        if (submitting || result) return;

        if (!auto) {
            const ok = window.confirm(
                isEn
                    ? 'Are you sure you want to submit?'
                    : 'Bạn chắc chắn muốn nộp bài?'
            );
            if (!ok) return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/results/submit', {
                testId: Number(id),
                answers
            });
            setResult(res.data);
            if (auto) {
                setAutoSubmitted(true);
            }
        } catch (e) {
            alert(
                isEn
                    ? 'Failed to submit. Please try again.'
                    : 'Không nộp được bài, vui lòng thử lại.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitClick = () => {
        submitTest(false);
    };

    // Load review sau khi nộp
    const loadReview = async () => {
        if (!result || !result.id) return;
        setLoadingReview(true);
        try {
            const res = await api.get(`/results/review/${result.id}`);
            setReview(res.data);
        } catch (e) {
            alert(
                isEn
                    ? 'Cannot load review.'
                    : 'Không tải được phần xem lại đáp án.'
            );
        } finally {
            setLoadingReview(false);
        }
    };

    if (!test) {
        return (
            <div>
                {isEn ? 'Loading test...' : 'Đang tải đề kiểm tra...'}
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4 className="page-title mb-1">{test.title}</h4>
                    <p className="text-muted mb-0 small">
                        {isEn ? 'Duration' : 'Thời lượng'}: {test.duration_minutes}{' '}
                        {isEn ? 'minutes' : 'phút'} ·{' '}
                        {isEn ? 'Total marks' : 'Tổng điểm'}: {test.total_marks}
                    </p>
                </div>

                <div className="text-end small text-muted">
                    {timeLeft != null && !result && (
                        <div className="mb-2">
                            <span>
                                {isEn
                                    ? 'Time remaining:'
                                    : 'Thời gian còn lại:'}{' '}
                            </span>
                            <span
                                className={
                                    timeLeft <= 60
                                        ? 'text-warning fw-bold'
                                        : 'fw-semibold'
                                }
                            >
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}
                    <div>
                        {isEn
                            ? 'Answers are saved automatically when you select an option.'
                            : 'Hệ thống tự động lưu khi bạn chọn đáp án.'}
                    </div>
                    <div>
                        {isEn
                            ? 'Please double-check before clicking "Submit".'
                            : 'Vui lòng kiểm tra kỹ trước khi bấm "Nộp bài".'}
                    </div>
                </div>
            </div>

            {result ? (
                <>
                    <div className="alert alert-success">
                        <h5 className="mb-2">
                            {autoSubmitted
                                ? isEn
                                    ? 'Time is up. Your test was submitted automatically.'
                                    : 'Hết thời gian. Bài làm của bạn đã được nộp tự động.'
                                : isEn
                                    ? 'Your test was submitted successfully.'
                                    : 'Bạn đã nộp bài thành công.'}
                        </h5>
                        <p className="mb-2">
                            {isEn ? 'Your score:' : 'Điểm của bạn:'}{' '}
                            <strong>{result.score}</strong> / {result.maxScore}
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => navigate('/results')}
                            >
                                {isEn ? 'View my results' : 'Xem bảng điểm'}
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={loadReview}
                                disabled={loadingReview}
                            >
                                {loadingReview
                                    ? isEn
                                        ? 'Loading review...'
                                        : 'Đang tải xem lại...'
                                    : isEn
                                        ? 'Review answers'
                                        : 'Xem lại đáp án'}
                            </button>
                            <button
                                className="btn btn-link btn-sm"
                                onClick={() => navigate('/')}
                            >
                                {isEn ? 'Back to home' : 'Về trang chính'}
                            </button>
                        </div>
                    </div>

                    {/* Khối review chi tiết */}
                    {review && (
                        <div className="card mb-3 shadow-sm">
                            <div className="card-body">
                                <h5 className="mb-3">
                                    {isEn ? 'Answer review' : 'Xem lại đáp án'}
                                </h5>
                                {review.questions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className="mb-3 p-2 border rounded"
                                    >
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
                                            {isEn ? 'Marks:' : 'Điểm:'} {q.gainedPoints} /{' '}
                                            {q.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="card mb-3 shadow-sm">
                        <div className="card-body">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="question-block mb-3">
                                    <div className="fw-semibold mb-1">
                                        {isEn ? 'Question' : 'Câu'} {idx + 1}. {q.content}
                                    </div>

                                    {q.type === 'mcq' && (
                                        <div>
                                            {q.options.map((opt, i) => (
                                                <div className="form-check" key={i}>
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name={`q_${q.id}`}
                                                        id={`q_${q.id}_${i}`}
                                                        checked={answers[q.id] === opt}
                                                        onChange={() => updateAnswer(q.id, opt)}
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`q_${q.id}_${i}`}
                                                    >
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div>
                                            {['true', 'false'].map((val) => (
                                                <div className="form-check" key={val}>
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name={`q_${q.id}`}
                                                        id={`q_${q.id}_${val}`}
                                                        checked={answers[q.id] === val}
                                                        onChange={() => updateAnswer(q.id, val)}
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`q_${q.id}_${val}`}
                                                    >
                                                        {val === 'true'
                                                            ? isEn
                                                                ? 'True'
                                                                : 'Đúng'
                                                            : isEn
                                                                ? 'False'
                                                                : 'Sai'}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(q.type === 'short' || q.type === 'essay') && (
                                        <textarea
                                            className="form-control"
                                            rows={q.type === 'short' ? 2 : 4}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleSubmitClick}
                        disabled={submitting}
                    >
                        {submitting
                            ? isEn
                                ? 'Submitting...'
                                : 'Đang nộp bài...'
                            : isEn
                                ? 'Submit test'
                                : 'Nộp bài'}
                    </button>
                </>
            )}
        </div>
    );
}

export default TestTakingPage;
