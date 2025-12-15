// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json());

// ============ Helper & Middleware ============

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = payload;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: ' + role + ' only' });
    }
    next();
  };
}

// Simple root
app.get('/', (req, res) => {
  res.send('Exam system backend is running.');
});

// ============ AUTH ============

// Đăng ký
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !['teacher', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (row) return res.status(400).json({ message: 'Email already used' });

    bcrypt.hash(password, 10, (err2, hash) => {
      if (err2) return res.status(500).json({ message: 'Hash error' });

      db.run(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role],
        function (err3) {
          if (err3) return res.status(500).json({ message: 'DB insert error' });
          const user = { id: this.lastID, name, email, role };
          const token = generateToken(user);
          res.json({ user, token });
        }
      );
    });
  });
});

// Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Missing email or password' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    bcrypt.compare(password, user.password_hash, (err2, same) => {
      if (err2) return res.status(500).json({ message: 'Compare error' });
      if (!same)
        return res.status(401).json({ message: 'Invalid credentials' });

      const token = generateToken(user);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      });
    });
  });
});

// Lấy user hiện tại
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ============ QUESTIONS (Teacher) ============

// Tạo câu hỏi
app.post(
  '/api/questions',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const {
      content,
      type,
      options,
      correctAnswer,
      subject,
      topic,
      difficulty
    } = req.body;

    if (!content || !type) {
      return res.status(400).json({ message: 'Missing content or type' });
    }

    const optionsJson = options ? JSON.stringify(options) : null;

    db.run(
      `
      INSERT INTO questions
      (teacher_id, content, type, options, correct_answer, subject, topic, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.user.id,
        content,
        type,
        optionsJson,
        correctAnswer || null,
        subject || null,
        topic || null,
        difficulty || null
      ],
      function (err) {
        if (err) return res.status(500).json({ message: 'DB insert error' });

        res.status(201).json({
          id: this.lastID,
          content,
          type,
          options,
          correctAnswer,
          subject,
          topic,
          difficulty
        });
      }
    );
  }
);

// Lấy danh sách câu hỏi
app.get(
  '/api/questions',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { search } = req.query;
    let sql = 'SELECT * FROM questions WHERE teacher_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND content LIKE ?';
      params.push('%' + search + '%');
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });

      const data = rows.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }));

      res.json(data);
    });
  }
);

// Cập nhật câu hỏi
app.put(
  '/api/questions/:id',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { id } = req.params;
    const {
      content,
      type,
      options,
      correctAnswer,
      subject,
      topic,
      difficulty
    } = req.body;

    const optionsJson = options ? JSON.stringify(options) : null;

    db.run(
      `
      UPDATE questions
      SET content = ?, type = ?, options = ?, correct_answer = ?, subject = ?, topic = ?, difficulty = ?
      WHERE id = ? AND teacher_id = ?
    `,
      [
        content,
        type,
        optionsJson,
        correctAnswer || null,
        subject || null,
        topic || null,
        difficulty || null,
        id,
        req.user.id
      ],
      function (err) {
        if (err) return res.status(500).json({ message: 'DB update error' });
        if (this.changes === 0)
          return res.status(404).json({ message: 'Question not found' });

        res.json({ message: 'Updated' });
      }
    );
  }
);

// Xóa câu hỏi
app.delete(
  '/api/questions/:id',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { id } = req.params;
    db.run(
      'DELETE FROM questions WHERE id = ? AND teacher_id = ?',
      [id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: 'DB delete error' });
        if (this.changes === 0)
          return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Deleted' });
      }
    );
  }
);

// ============ TESTS ============

// Tạo đề thi từ question bank
app.post(
  '/api/tests',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const {
      title,
      description,
      durationMinutes,
      startTime,
      endTime,
      questions
    } = req.body;

    if (!title || !durationMinutes || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Missing data' });
    }

    const totalMarks = questions.reduce(
      (sum, q) => sum + (parseInt(q.points, 10) || 0),
      0
    );

    db.serialize(() => {
      db.run(
        `
        INSERT INTO tests
        (teacher_id, title, description, duration_minutes, total_marks, start_time, end_time, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `,
        [
          req.user.id,
          title,
          description || null,
          durationMinutes,
          totalMarks,
          startTime || null,
          endTime || null
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'DB insert test error' });
          }

          const testId = this.lastID;
          const stmt = db.prepare(
            'INSERT INTO test_questions (test_id, question_id, points) VALUES (?, ?, ?)'
          );

          questions.forEach((q) => {
            stmt.run(testId, q.questionId, q.points);
          });

          stmt.finalize((err2) => {
            if (err2)
              return res
                .status(500)
                .json({ message: 'DB insert test_questions error' });

            res.status(201).json({ id: testId, totalMarks });
          });
        }
      );
    });
  }
);

// Lấy danh sách đề thi
app.get('/api/tests', authMiddleware, (req, res) => {
  if (req.user.role === 'teacher') {
    db.all(
      'SELECT * FROM tests WHERE teacher_id = ? ORDER BY created_at DESC',
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        res.json(rows);
      }
    );
  } else {
    // Student: chỉ thấy các đề publish và trong thời gian cho phép
    const nowIso = new Date().toISOString();
    const sql = `
      SELECT t.*, u.name AS teacher_name
      FROM tests t
      JOIN users u ON t.teacher_id = u.id
      WHERE t.is_published = 1
        AND (t.start_time IS NULL OR t.start_time <= ?)
        AND (t.end_time IS NULL OR t.end_time >= ?)
      ORDER BY t.start_time DESC
    `;
    db.all(sql, [nowIso, nowIso], (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    });
  }
});

// Lấy chi tiết đề + câu hỏi
app.get('/api/tests/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM tests WHERE id = ?', [id], (err, test) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!test) return res.status(404).json({ message: 'Test not found' });

    db.all(
      `
      SELECT q.id, q.content, q.type, q.options, q.correct_answer, q.subject, q.topic, q.difficulty, tq.points
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      WHERE tq.test_id = ?
      ORDER BY tq.id
    `,
      [id],
      (err2, rows) => {
        if (err2) return res.status(500).json({ message: 'DB error' });

        let questions = rows.map((q) => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : []
        }));

        // Hide correct_answer cho student
        if (req.user.role === 'student') {
          questions = questions.map(({ correct_answer, ...rest }) => rest);
        }

        res.json({ test, questions });
      }
    );
  });
});

// Teacher chỉnh sửa đề thi đã tạo
app.put(
  '/api/tests/:id',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      durationMinutes,
      startTime,
      endTime,
      questions
    } = req.body;

    if (!title || !durationMinutes || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Missing data' });
    }

    const totalMarks = questions.reduce(
      (sum, q) => sum + (parseInt(q.points, 10) || 0),
      0
    );

    db.serialize(() => {
      // Cập nhật thông tin đề
      db.run(
        `
        UPDATE tests
        SET title = ?, description = ?, duration_minutes = ?, total_marks = ?,
            start_time = ?, end_time = ?
        WHERE id = ? AND teacher_id = ?
      `,
        [
          title,
          description || null,
          durationMinutes,
          totalMarks,
          startTime || null,
          endTime || null,
          id,
          req.user.id
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'DB update test error' });
          }
          if (this.changes === 0) {
            return res
              .status(404)
              .json({ message: 'Test not found or not your test' });
          }

          // Xóa các mapping cũ trong test_questions
          db.run(
            'DELETE FROM test_questions WHERE test_id = ?',
            [id],
            function (err2) {
              if (err2) {
                console.error(err2);
                return res
                  .status(500)
                  .json({ message: 'DB delete test_questions error' });
              }

              // Thêm lại mapping mới
              const stmt = db.prepare(
                'INSERT INTO test_questions (test_id, question_id, points) VALUES (?, ?, ?)'
              );
              questions.forEach((q) => {
                stmt.run(id, q.questionId, q.points);
              });
              stmt.finalize((err3) => {
                if (err3) {
                  console.error(err3);
                  return res
                    .status(500)
                    .json({ message: 'DB insert test_questions error' });
                }

                res.json({
                  id: Number(id),
                  totalMarks,
                  message: 'Test updated successfully'
                });
              });
            }
          );
        }
      );
    });
  }
);

// Teacher xóa đề thi đã tạo
app.delete(
  '/api/tests/:id',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { id } = req.params;

    db.run(
      'DELETE FROM tests WHERE id = ? AND teacher_id = ?',
      [id, req.user.id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'DB delete test error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ message: 'Test not found or not your test' });
        }

        // Nhờ FOREIGN KEY ON DELETE CASCADE trong schema,
        // test_questions và results liên quan sẽ được xóa theo.
        res.json({ message: 'Test deleted successfully' });
      }
    );
  }
);


// ============ RESULTS ============

// Student nộp bài, chấm điểm và lưu chi tiết cho review
app.post(
  '/api/results/submit',
  authMiddleware,
  requireRole('student'),
  (req, res) => {
    const { testId, answers } = req.body;

    if (!testId || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    // Lấy danh sách câu hỏi + điểm cho đề này
    db.all(
      `
      SELECT tq.question_id AS questionId,
             tq.points       AS points,
             q.type          AS type,
             q.correct_answer AS correctAnswer
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      WHERE tq.test_id = ?
      ORDER BY tq.id
    `,
      [testId],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'DB error when loading test questions' });
        }
        if (!rows || rows.length === 0) {
          return res.status(404).json({ message: 'No questions for this test' });
        }

        const details = [];
        let totalScore = 0;
        let maxScore = 0;

        rows.forEach((row) => {
          const qId = row.questionId;
          const points = parseInt(row.points, 10) || 0;
          maxScore += points;

          const rawStudentAnswer = answers[qId] ?? answers[String(qId)] ?? null;
          let studentAnswer = rawStudentAnswer;
          let isCorrect = false;
          let gainedPoints = 0;

          // Chấm tự động cho MCQ và True/False
          if (
            rawStudentAnswer != null &&
            row.correctAnswer != null &&
            (row.type === 'mcq' || row.type === 'true_false')
          ) {
            const s = String(rawStudentAnswer).trim();
            const c = String(row.correctAnswer).trim();
            if (s === c) {
              isCorrect = true;
              gainedPoints = points;
            }
          }

          totalScore += gainedPoints;

          details.push({
            questionId: qId,               // ID câu hỏi
            studentAnswer,                 // Câu trả lời của HS
            correctAnswer: row.correctAnswer,
            isCorrect,
            points,
            gainedPoints
          });
        });

        const detailsJson = JSON.stringify({
          testId: Number(testId),
          maxScore,
          answers: details
        });

        // Lưu vào bảng results
        db.run(
          `
          INSERT INTO results (test_id, student_id, score, submitted_at, details_json)
          VALUES (?, ?, ?, datetime('now'), ?)
        `,
          [testId, req.user.id, totalScore, detailsJson],
          function (err2) {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ message: 'DB error when saving result' });
            }

            return res.json({
              id: this.lastID,
              score: totalScore,
              maxScore
            });
          }
        );
      }
    );
  }
);


// Student xem lịch sử điểm
app.get(
  '/api/results/my',
  authMiddleware,
  requireRole('student'),
  (req, res) => {
    db.all(
      `
      SELECT r.*, t.title, t.total_marks
      FROM results r
      JOIN tests t ON r.test_id = t.id
      WHERE r.student_id = ?
      ORDER BY r.submitted_at DESC
    `,
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        res.json(rows);
      }
    );
  }
);

// Student xem lại chi tiết bài làm theo từng lần nộp (resultId)
app.get(
  '/api/results/review/:resultId',
  authMiddleware,
  requireRole('student'),
  (req, res) => {
    const { resultId } = req.params;

    // Lấy đúng 1 bản ghi kết quả theo id
    db.get(
      `
      SELECT *
      FROM results
      WHERE id = ? AND student_id = ?
    `,
      [resultId, req.user.id],
      (err, resultRow) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ message: 'DB error (results review)' });
        }
        if (!resultRow) {
          return res
            .status(404)
            .json({ message: 'Result not found for this student' });
        }

        let detailsObj = null;
        try {
          detailsObj = resultRow.details_json
            ? JSON.parse(resultRow.details_json)
            : null;
        } catch (e) {
          detailsObj = null;
        }

        const answersDetails = Array.isArray(detailsObj?.answers)
          ? detailsObj.answers
          : [];
        const maxScore = detailsObj?.maxScore ?? null;
        const testId = detailsObj?.testId ?? resultRow.test_id;

        // Lấy thông tin đề thi
        db.get('SELECT * FROM tests WHERE id = ?', [testId], (err2, test) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: 'DB error (test)' });
          }
          if (!test) {
            return res
              .status(404)
              .json({ message: 'Test not found for this result' });
          }

          // Lấy nội dung câu hỏi tương ứng
          db.all(
            `
            SELECT q.id, q.content, q.type, q.options
            FROM test_questions tq
            JOIN questions q ON tq.question_id = q.id
            WHERE tq.test_id = ?
            ORDER BY tq.id
          `,
            [testId],
            (err3, questionRows) => {
              if (err3) {
                console.error(err3);
                return res
                  .status(500)
                  .json({ message: 'DB error (questions)' });
              }

              const mergedQuestions = questionRows.map((q) => {
                const d = answersDetails.find(
                  (item) =>
                    item.questionId === q.id ||
                    item.question_id === q.id // fallback nếu format cũ
                );

                return {
                  id: q.id,
                  content: q.content,
                  type: q.type,
                  options: q.options ? JSON.parse(q.options) : [],
                  studentAnswer: d ? d.studentAnswer ?? d.answer ?? null : null,
                  correctAnswer: d ? d.correctAnswer ?? null : null,
                  isCorrect: d ? !!d.isCorrect : false,
                  points: d ? d.points ?? 0 : 0,
                  gainedPoints: d ? d.gainedPoints ?? 0 : 0
                };
              });

              res.json({
                test,
                result: {
                  id: resultRow.id,
                  test_id: testId,
                  score: resultRow.score,
                  maxScore,
                  submitted_at: resultRow.submitted_at
                },
                questions: mergedQuestions
              });
            }
          );
        });
      }
    );
  }
);

// Teacher xem thống kê 1 đề
app.get(
  '/api/results/summary/:testId',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    const { testId } = req.params;

    db.get(
      'SELECT * FROM tests WHERE id = ? AND teacher_id = ?',
      [testId, req.user.id],
      (err, test) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (!test)
          return res
            .status(404)
            .json({ message: 'Test not found or not your test' });

        db.all(
          `
          SELECT r.*, u.name AS student_name
          FROM results r
          JOIN users u ON r.student_id = u.id
          WHERE r.test_id = ?
          ORDER BY r.submitted_at ASC
        `,
          [testId],
          (err2, rows) => {
            if (err2) return res.status(500).json({ message: 'DB error' });

            const totalAttempts = rows.length;
            const totalScore = rows.reduce((s, r) => s + r.score, 0);
            const avgScore = totalAttempts ? totalScore / totalAttempts : 0;
            const best = rows.reduce(
              (max, r) => (r.score > max ? r.score : max),
              0
            );
            const worst = rows.reduce(
              (min, r) => (r.score < min ? r.score : min),
              totalAttempts ? rows[0].score : 0
            );

            res.json({
              test,
              stats: {
                totalAttempts,
                avgScore,
                best,
                worst
              },
              results: rows
            });
          }
        );
      }
    );
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
