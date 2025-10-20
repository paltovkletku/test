:root{
  --bg: #f5f7fb;
  --card: #ffffff;
  --accent: #4f46e5;
  --muted: #6b7280;
  --danger: #e11d48;
  --success: #10b981;
  --border: rgba(15,23,42,0.06);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  background:var(--bg);
  color:#111827;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* Контейнер */
.container{
  max-width:1000px;
  margin:28px auto;
  padding:16px;
}

/* Карточка */
.card{
  background:var(--card);
  border-radius:12px;
  box-shadow:0 8px 24px rgba(15,23,42,0.06);
  padding:16px;
}

/* Header */
.header{
  display:flex;
  gap:12px;
  align-items:center;
  justify-content:space-between;
  margin-bottom:14px;
}
.title{
  margin:0;
  font-size:20px;
}
.controls{
  display:flex;
  gap:8px;
  align-items:center;
  flex-wrap:wrap;
}

/* Inputs / buttons */
.input, .select, .search{
  padding:10px 12px;
  border-radius:8px;
  border:1px solid var(--border);
  font-size:14px;
  background:transparent;
}
.button{
  border:0;
  padding:8px 12px;
  border-radius:8px;
  cursor:pointer;
  background:var(--accent);
  color:white;
  font-weight:600;
}
.button.ghost{
  background:transparent;
  color:var(--muted);
  border:1px solid var(--border);
}
.small{
  padding:6px 8px;
  font-size:13px;
  border-radius:8px;
}

/* Форма добавления */
.form-row{
  display:grid;
  grid-template-columns: 1fr 200px 120px;
  gap:8px;
  align-items:center;
  margin-bottom:12px;
}
@media (max-width:700px){
  .form-row{ grid-template-columns: 1fr 1fr; }
  .form-row input[type="date"]{ grid-column:2/3; }
  .form-row button{ grid-column:1/3; }
}

/* Список */
.list{
  margin:0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.task-item{
  display:flex;
  align-items:center;
  gap:12px;
  padding:10px;
  border-radius:10px;
  border:1px solid var(--border);
  background:linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2));
}
.task-item.dragging{
  opacity:0.5;
}
.task-main{
  display:flex;
  flex-direction:column;
  flex:1;
}
.task-title{
  font-weight:600;
}
.task-meta{
  font-size:12px;
  color:var(--muted);
}

/* Checkbox-ish */
.checkbox{
  width:20px;
  height:20px;
  border-radius:6px;
  border:2px solid var(--border);
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  background:white;
}

/* Completed */
.task-item.completed{
  opacity:0.6;
  text-decoration:line-through;
}

/* Actions */
.actions{
  display:flex;
  gap:8px;
  align-items:center;
}
.btn-edit{
  background:#f3f4f6;
  border:0;
  padding:6px 8px;
  border-radius:8px;
}
.btn-delete{
  background:transparent;
  border:0;
  color:var(--danger);
  padding:6px 8px;
  border-radius:8px;
}

/* Drag handle */
.drag-handle{
  cursor:grab;
  padding:6px;
  user-select:none;
}

/* Пустой список */
.empty-note{
  text-align:center;
  color:var(--muted);
  padding:18px 8px;
}

/* Footer */
.footer{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:12px;
  font-size:13px;
  color:var(--muted);
}

