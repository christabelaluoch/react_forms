"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentForm } from "../components/forms/studentform";
import { CourseForm } from "../components/forms/courseform";

export default function SimpleColorfulDashboard() {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetch("http://localhost:3000/api/students", {
      method: "GET",
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      cache: "no-store"
    }).then(r => r.json()).then(j => j.data)
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => fetch("http://localhost:3000/api/courses", {
      method: "GET",
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      cache: "no-store"
    }).then(r => r.json()).then(j => j.data)
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`http://localhost:3000/api/students/${id}`, { 
        method: "DELETE",
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      alert("Deleted successfully!");
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`http://localhost:3000/api/courses/${id}`, { 
        method: "DELETE",
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      alert("Deleted successfully!");
      setSelectedCourse(null);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fff5f7 0%, #fbf8fd 100%)", padding: "40px 20px", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", gap: "40px", alignItems: "center" }}>
      
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "900", color: "#111827" }}>Cutesy Forms</h1>
        <p style={{ margin: "5px 0 0 0", fontSize: "14px", fontWeight: "600", color: "#4b5563" }}>Simple and Interesting</p>
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: "30px", flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: "980px" }}>
        <StudentForm selectedStudent={selectedStudent} clearSelection={() => setSelectedStudent(null)} />
        <CourseForm selectedCourse={selectedCourse} clearSelection={() => setSelectedCourse(null)} />
      </div>

      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "24px", width: "100%", maxWidth: "940px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        <div>
          <h4 style={{ margin: "0 0 12px 0", color: "#ec4899" }}>Students Registry</h4>
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
            {students.map(s => (
              <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", padding: "10px 14px", borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <strong>{s.firstName} {s.lastName}</strong>
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>{s.email}</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => setSelectedStudent(s)} style={{ padding: "6px 12px", background: "#ec4899", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>Select</button>
                  <button type="button" onClick={() => { if(confirm("Are you sure?")) deleteStudentMutation.mutate(s.id); }} style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ margin: "0 0 12px 0", color: "#f97316" }}>Courses Registry</h4>
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
            {courses.map(c => (
              <li key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", padding: "10px 14px", borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <strong>{c.code} — {c.title}</strong>
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>{c.credits} cr</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => setSelectedCourse(c)} style={{ padding: "6px 12px", background: "#f97316", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>Select</button>
                  <button type="button" onClick={() => { if(confirm("Are you sure?")) deleteCourseMutation.mutate(c.id); }} style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}
