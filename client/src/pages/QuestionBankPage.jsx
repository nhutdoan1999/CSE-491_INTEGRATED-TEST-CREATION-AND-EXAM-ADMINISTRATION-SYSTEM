// client/src/pages/QuestionBankPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../langContext';

const EMPTY_FORM = {
    content: '',
    type: 'mcq',
    optionsText: '',
    correctAnswer: '',
    subject: '',
    topic: '',
    difficulty: 'medium'
};

function QuestionBankPage() {
    const { lang } = useLang();
    const isEn = lang === 'en';

    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/questions');
            setQuestions(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        const options =
            form.type === 'mcq'
                ? form.optionsText.split('\n').filter((s) => s.trim() !== '')
                : undefined;

        try {
            await api.post('/questions', {
                content: form.content,
                type: form.type,
                options,
                correctAnswer: form.correctAnswer,
                subject: form.subject,
                topic: form.topic,
                difficulty: form.difficulty
            });
            setForm(EMPTY_FORM);
            loadQuestions();
        } catch (e) {
            alert(
                isEn ? 'Failed to create question.' : 'Lỗi khi tạo câu hỏi.'
            );
        }
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                isEn ? 'Delete this question?' : 'Xóa câu hỏi này?'
            )
        )
            return;
        try {
            await api.delete(`/questions/${id}`);
            setQuestions((qs) => qs.filter((q) => q.id !== id));
        } catch {
            alert(isEn ? 'Cannot delete question.' : 'Không xóa được câu hỏi.');
        }
    };

    return (
        <div>
            <h4 className="page-title">
                {isEn ? 'Question Bank' : 'Ngân hàng câu hỏi'}
            </h4>
            <p className="page-subtitle">
                {isEn
                    ? 'Create and manage questions by subject, topic, and difficulty. Questions can be reused across multiple tests.'
                    : 'Tạo và quản lý câu hỏi theo môn học, chủ đề và độ khó. Câu hỏi được tái sử dụng nhiều lần trong các đề khác nhau.'}
            </p>
            <div className="row">
                <div className="col-md-5 mb-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">
                                {isEn ? 'Add new question' : 'Thêm câu hỏi mới'}
                            </h5>
                            <form onSubmit={handleCreate}>
                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Question content' : 'Nội dung câu hỏi'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        name="content"
                                        value={form.content}
                                        onChange={onChange}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Question type' : 'Loại câu hỏi'}
                                    </label>
                                    <select
                                        className="form-select"
                                        name="type"
                                        value={form.type}
                                        onChange={onChange}
                                    >
                                        <option value="mcq">
                                            {isEn ? 'Multiple choice (MCQ)' : 'Trắc nghiệm (MCQ)'}
                                        </option>
                                        <option value="true_false">
                                            {isEn ? 'True / False' : 'Đúng / Sai'}
                                        </option>
                                        <option value="short">
                                            {isEn ? 'Short answer' : 'Tự luận ngắn'}
                                        </option>
                                        <option value="essay">
                                            {isEn ? 'Essay' : 'Tự luận'}
                                        </option>
                                    </select>
                                </div>

                                {form.type === 'mcq' && (
                                    <div className="mb-2">
                                        <label className="form-label">
                                            {isEn
                                                ? 'Options (one per line)'
                                                : 'Các lựa chọn (mỗi dòng một phương án)'}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="optionsText"
                                            rows={3}
                                            value={form.optionsText}
                                            onChange={onChange}
                                        />
                                    </div>
                                )}

                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Correct answer' : 'Đáp án đúng'}
                                    </label>
                                    <input
                                        className="form-control"
                                        name="correctAnswer"
                                        value={form.correctAnswer}
                                        onChange={onChange}
                                        placeholder={
                                            form.type === 'true_false'
                                                ? isEn
                                                    ? 'true or false'
                                                    : 'true hoặc false'
                                                : isEn
                                                    ? 'E.g. A, B, 1, 2...'
                                                    : 'Ví dụ: A, B, 1, 2...'
                                        }
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Subject' : 'Môn học'}
                                    </label>
                                    <input
                                        className="form-control"
                                        name="subject"
                                        value={form.subject}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label">
                                        {isEn ? 'Topic' : 'Chủ đề'}
                                    </label>
                                    <input
                                        className="form-control"
                                        name="topic"
                                        value={form.topic}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        {isEn ? 'Difficulty' : 'Độ khó'}
                                    </label>
                                    <select
                                        className="form-select"
                                        name="difficulty"
                                        value={form.difficulty}
                                        onChange={onChange}
                                    >
                                        <option value="easy">
                                            {isEn ? 'Easy' : 'Dễ'}
                                        </option>
                                        <option value="medium">
                                            {isEn ? 'Medium' : 'Trung bình'}
                                        </option>
                                        <option value="hard">
                                            {isEn ? 'Hard' : 'Khó'}
                                        </option>
                                    </select>
                                </div>

                                <button className="btn btn-primary" type="submit">
                                    {isEn ? 'Save question' : 'Lưu câu hỏi'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="card-title mb-0">
                                    {isEn ? 'Question list' : 'Danh sách câu hỏi'}
                                </h5>
                                {loading && (
                                    <span className="text-muted small">
                                        {isEn ? 'Loading...' : 'Đang tải...'}
                                    </span>
                                )}
                            </div>
                            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{isEn ? 'Content' : 'Nội dung'}</th>
                                            <th>{isEn ? 'Subject' : 'Môn'}</th>
                                            <th>{isEn ? 'Difficulty' : 'Độ khó'}</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questions.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted">
                                                    {isEn
                                                        ? 'No questions yet.'
                                                        : 'Chưa có câu hỏi nào.'}
                                                </td>
                                            </tr>
                                        )}
                                        {questions.map((q, idx) => (
                                            <tr key={q.id}>
                                                <td>{idx + 1}</td>
                                                <td style={{ maxWidth: 260 }}>
                                                    <div className="small">{q.content}</div>
                                                </td>
                                                <td>{q.subject}</td>
                                                <td>{q.difficulty}</td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(q.id)}
                                                    >
                                                        {isEn ? 'Delete' : 'Xóa'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <small className="text-muted">
                                {isEn
                                    ? '* Simple interface to demonstrate the question bank feature in the project.'
                                    : '* Giao diện đơn giản để minh họa chức năng ngân hàng câu hỏi trong đồ án.'}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestionBankPage;
