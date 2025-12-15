// client/src/pages/TestCreationPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function TestCreationPage() {
    const navigate = useNavigate();
    const { lang } = useLang();
    const isEn = lang === 'en';

    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        durationMinutes: 45,
        startTime: '',
        endTime: ''
    });
    const [selected, setSelected] = useState({});
    const [createdTest, setCreatedTest] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/questions');
                setQuestions(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const toggleSelect = (qId) => {
        setSelected((s) => {
            const copy = { ...s };
            if (copy[qId]) delete copy[qId];
            else copy[qId] = 1;
            return copy;
        });
    };

    const changePoint = (qId, value) => {
        setSelected((s) => ({
            ...s,
            [qId]: parseInt(value || 0, 10)
        }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const questionsPayload = Object.entries(selected)
            .filter(([, points]) => points > 0)
            .map(([questionId, points]) => ({
                questionId: Number(questionId),
                points
            }));

        if (!questionsPayload.length) {
            alert(
                isEn
                    ? 'Please select at least one question and assign points > 0.'
                    : 'Hãy chọn ít nhất một câu hỏi và điểm số > 0.'
            );
            return;
        }

        try {
            const res = await api.post('/tests', {
                title: form.title,
                description: form.description,
                durationMinutes: Number(form.durationMinutes),
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                questions: questionsPayload
            });

            setCreatedTest({
                id: res.data.id,
                totalMarks: res.data.totalMarks,
                title: form.title
            });

            alert(
                isEn
                    ? 'Test created successfully. Test code and share link have been generated.'
                    : 'Tạo đề thành công. Mã đề và link chia sẻ đã được tạo.'
            );
        } catch (e) {
            console.error(e);
            alert(isEn ? 'Failed to create test.' : 'Không tạo được đề.');
        }
    };

    const totalMarks = Object.values(selected).reduce(
        (sum, p) => sum + (p || 0),
        0
    );

    const shareLink = createdTest
        ? `${window.location.origin}/take/${createdTest.id}`
        : '';

    const handleCopyLink = () => {
        if (!shareLink) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(shareLink)
                .then(() => {
                    alert(
                        isEn
                            ? 'Link copied to clipboard.'
                            : 'Đã sao chép link vào clipboard.'
                    );
                })
                .catch(() => {
                    alert(
                        isEn
                            ? 'Cannot copy automatically. Please copy manually.'
                            : 'Không thể sao chép tự động, vui lòng copy tay.'
                    );
                });
        } else {
            window.prompt(
                isEn
                    ? 'Copy this link and send it to students:'
                    : 'Sao chép đường link rồi gửi cho học sinh:',
                shareLink
            );
        }
    };

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Create test' : 'Tạo đề kiểm tra'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'Select questions from the bank, configure timing, and get a test code / share link for students (similar to platforms like Azota).'
                    : 'Chọn câu hỏi từ ngân hàng, thiết lập thời lượng và nhận mã đề / link chia sẻ cho học sinh (giống cách chia sẻ bài trên Azota).'}
            </p>

            {createdTest && (
                <div className="alert alert-success d-flex justify-content-between align-items-start">
                    <div>
                        <div className="fw-semibold mb-1">
                            {isEn ? 'Test' : 'Đề kiểm tra'}{' '}
                            <span className="text-primary">{createdTest.title}</span>{' '}
                            {isEn ? 'has been created successfully.' : 'đã được tạo thành công.'}
                        </div>
                        <div className="small">
                            <div>
                                {isEn ? 'Test code:' : 'Mã đề:'}{' '}
                                <code>{createdTest.id}</code>
                            </div>
                            <div>
                                {isEn ? 'Test link:' : 'Link làm bài:'}{' '}
                                <code>{shareLink}</code>
                            </div>
                        </div>
                        <div className="small text-muted mt-1">
                            {isEn
                                ? 'Share this code or link with students so they can access the test.'
                                : 'Gửi mã đề hoặc đường link này cho học sinh để các em truy cập và làm bài.'}
                        </div>
                    </div>
                    <div className="d-flex flex-column gap-2 align-items-end ms-3">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleCopyLink}
                        >
                            {isEn ? 'Copy link' : 'Sao chép link'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-link"
                            onClick={() => navigate('/')}
                        >
                            {isEn ? 'Back to dashboard' : 'Về trang tổng quan'}
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleCreate}>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn ? 'Test title' : 'Tên đề'}
                            </label>
                            <input
                                className="form-control"
                                name="title"
                                value={form.title}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn ? 'Description' : 'Mô tả'}
                            </label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={form.description}
                                onChange={onChange}
                                rows={2}
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn ? 'Duration (minutes)' : 'Thời lượng (phút)'}
                            </label>
                            <input
                                className="form-control"
                                type="number"
                                name="durationMinutes"
                                value={form.durationMinutes}
                                onChange={onChange}
                                min={1}
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn
                                    ? 'Open time (optional)'
                                    : 'Thời gian mở bài (không bắt buộc)'}
                            </label>
                            <input
                                className="form-control"
                                type="datetime-local"
                                name="startTime"
                                value={form.startTime}
                                onChange={onChange}
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn
                                    ? 'Close time (optional)'
                                    : 'Thời gian đóng bài (không bắt buộc)'}
                            </label>
                            <input
                                className="form-control"
                                type="datetime-local"
                                name="endTime"
                                value={form.endTime}
                                onChange={onChange}
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                {isEn ? 'Total marks' : 'Tổng điểm'}
                            </label>
                            <input className="form-control" value={totalMarks} readOnly />
                        </div>
                    </div>
                </div>

                <h5 className="mb-2">
                    {isEn ? 'Select questions' : 'Chọn câu hỏi'}
                </h5>
                <div className="card mb-3 shadow-sm">
                    <div className="card-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
                        <table className="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th />
                                    <th>{isEn ? 'Content' : 'Nội dung'}</th>
                                    <th>{isEn ? 'Subject' : 'Môn'}</th>
                                    <th>{isEn ? 'Difficulty' : 'Độ khó'}</th>
                                    <th>{isEn ? 'Marks' : 'Điểm'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.map((q) => (
                                    <tr key={q.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected[q.id] != null}
                                                onChange={() => toggleSelect(q.id)}
                                            />
                                        </td>
                                        <td style={{ maxWidth: 280 }}>
                                            <small>{q.content}</small>
                                        </td>
                                        <td>{q.subject}</td>
                                        <td>{q.difficulty}</td>
                                        <td style={{ width: 80 }}>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={selected[q.id] || ''}
                                                onChange={(e) => changePoint(q.id, e.target.value)}
                                                disabled={!selected[q.id] && selected[q.id] !== 0}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {questions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-3">
                                            {isEn
                                                ? 'No questions found. Please add questions to the bank first.'
                                                : 'Chưa có câu hỏi. Hãy thêm câu hỏi trong ngân hàng trước.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button className="btn btn-primary" type="submit">
                    {isEn ? 'Create test' : 'Tạo đề kiểm tra'}
                </button>
            </form>
        </div>
    );
}

export default TestCreationPage;
