const { createServer } = require("node:http");

let STUDENTS = [
  { id: 1, name: "Ivan", grades: [5, 4, 5], course: 2 }
];

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json");

  // GET /students
  if (method === "GET" && pathname === "/students") {
    const course = parsedUrl.searchParams.get("course");

    let result = [...STUDENTS];

    if (course) {
      result = result.filter(s => s.course === Number(course));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(result));
  }

  // POST /students
  if (method === "POST" && pathname === "/students") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.name || !data.course) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Name and course required" }));
        }

        const newStudent = {
          id: STUDENTS.length + 1,
          name: data.name,
          grades: data.grades || [],
          course: data.course
        };

        STUDENTS.push(newStudent);

        res.statusCode = 201;
        res.end(JSON.stringify(newStudent));

      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  // PATCH /students/:id
  if (method === "PATCH" && pathname.startsWith("/students/")) {

    const id = Number(pathname.split("/")[2]);

    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {

      const student = STUDENTS.find(s => s.id === id);

      if (!student) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Student not found" }));
      }

      const updates = JSON.parse(body);

      delete updates.id;

      Object.assign(student, updates);

      res.statusCode = 200;
      res.end(JSON.stringify(student));

    });

    return;
  }

  // DELETE /students/:id
  if (method === "DELETE" && pathname.startsWith("/students/")) {

    const id = Number(pathname.split("/")[2]);

    const originalLength = STUDENTS.length;

    STUDENTS = STUDENTS.filter(s => s.id !== id);

    if (STUDENTS.length === originalLength) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Student not found" }));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Student removed" }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});