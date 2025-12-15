// client/src/pages/TestEditPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useLang } from '../langContext';

function TestEditPage() {
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [qRes, tRes] = await Promise.all([
                    api.get('/questions'),
                    api.get(`/tests/${id}`)
                ]);

                setQuestions(qRes.data);

                const t = tRes.data.test;
                const qs = tRes.data.questions || [];

                // Chuyển dạng thời gian DB -> input datetime-local đơn giản
                const toInput = (s) =>
                    s ? s.replace(' ', 'T').slice(0, 16) : '';

                setForm({
                    title: t.title || '',
                    description: t.description || '',
                    durationMinutes: t.duration_minutes || 45,
                    startTime: toInput(t.start_time),
                    endTime: toInput(t.end_time)
                });

                const sel = {};
                qs.forEach((q) => {
                    sel[q.id] = q.points;
                });
                setSelected(sel);
            } catch (e) {
                console.error(e);
                alert(
                    isEn
                        ? 'Failed to load test for editing.'
                        : 'Không tải được đề để chỉnh sửa.'
                );
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate, isEn]);

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

    const totalMarks = Object.values(selected).reduce(
        (sum, p) => sum + (p || 0),
        0
    );

    const handleUpdate = async (e) => {
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
            const res = await api.put(`/tests/${id}`, {
                title: form.title,
                description: form.description,
                durationMinutes: Number(form.durationMinutes),
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                questions: questionsPayload
            });

            alert(
                isEn
                    ? 'Test updated successfully.'
                    : 'Cập nhật đề kiểm tra thành công.'
            );
            navigate('/');
        } catch (e) {
            console.error(e);
            alert(
                isEn
                    ? 'Failed to update test.'
                    : 'Không cập nhật được đề kiểm tra.'
            );
        }
    };

    if (loading) {
        return (
            <div>
                {isEn ? 'Loading test...' : 'Đang tải đề kiểm tra...'}
            </div>
        );
    }

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Edit test' : 'Chỉnh sửa đề kiểm tra'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'Update test information and selected questions.'
                    : 'Cập nhật thông tin đề và danh sách câu hỏi.'}
            </p>

            <form onSubmit={handleUpdate}>
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
                    {isEn ? 'Update test' : 'Cập nhật đề kiểm tra'}
                </button>{' '}
                <button
                    className="btn btn-link"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    {isEn ? 'Cancel' : 'Hủy'}
                </button>
            </form>
        </div>
    );
}

export default TestEditPage;
