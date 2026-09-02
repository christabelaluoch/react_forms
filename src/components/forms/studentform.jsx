"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function StudentForm({ selectedStudent, clearSelection }) {
  const queryClient = useQueryClient();
  const isEditing = !!selectedStudent;

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () =>
      fetch("http://localhost:3000/api/courses", {
        method: "GET",
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((j) => j.data),
  });

  const { handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      courseIds: [],
    },
  });

  const currentFirstName = watch("firstName");
  const currentLastName = watch("lastName");
  const currentEmail = watch("email");
  const currentCourseIds = watch("courseIds") || [];

  useEffect(() => {
    if (isEditing && selectedStudent) {
      reset({
        firstName: selectedStudent.firstName || "",
        lastName: selectedStudent.lastName || "",
        email: selectedStudent.email || "",
        courseIds: selectedStudent.courseIds ? selectedStudent.courseIds.map(String) : [],
      });
    } else {
      reset({ firstName: "", lastName: "", email: "", courseIds: [] });
    }
  }, [selectedStudent, isEditing, reset]);

  // 4. Handle backend submission logic
  const studentMutation = useMutation({
    mutationFn: async (formValues) => {
      const url = isEditing
        ? `http://localhost:3000/api/students/${selectedStudent.id}`
        : "http://localhost:3000/api/students";

      const method = isEditing ? "PUT" : "POST";

      let rawBoxes = formValues.courseIds || [];
      let boxArray = Array.isArray(rawBoxes) ? rawBoxes : [rawBoxes];

      const formattedPayload = {
        firstName: String(formValues.firstName || "").trim(),
        lastName: String(formValues.lastName || "").trim(),
        email: String(formValues.email || "").trim(),
        courseIds: boxArray
          .filter(Boolean)
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id)), 
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
        cache: "no-store",
        body: JSON.stringify(formattedPayload),
      });

      const payload = await response.json();
      if (!response.ok) throw payload;
      return payload.data;
    },
    onSuccess: () => {
      alert(isEditing ? "Updated successfully!" : "Created successfully!");
      reset({ firstName: "", lastName: "", email: "", courseIds: [] });
      if (isEditing) clearSelection();
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      alert(err?.error?.message || "Server validation failed. Please check inputs.");
    },
  });


  const handleCheckboxChange = (courseId) => {
    const idStr = String(courseId);
    if (currentCourseIds.includes(idStr)) {
      setValue("courseIds", currentCourseIds.filter((id) => id !== idStr));
    } else {
      setValue("courseIds", [...currentCourseIds, idStr]);
    }
  };

  const onSubmit = (data) => {
    studentMutation.mutate(data);
  };

 
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#ec4899" };
  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ padding: "24px", background: "#ffffff", borderRadius: "24px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid #ec4899", boxSizing: "border-box" }}>
      <h3 style={{ margin: 0, color: "#ec4899" }}>
        {isEditing ? "Edit Student" : "Add Student"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={labelStyle}>First Name</label>
          <input 
            type="text" 
            value={currentFirstName}
            onChange={(e) => setValue("firstName", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Last Name</label>
          <input 
            type="text" 
            value={currentLastName}
            onChange={(e) => setValue("lastName", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input 
            type="text" 
            value={currentEmail}
            onChange={(e) => setValue("email", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Course Enrolment</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto", background: "#fff5f5", padding: "10px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            {courses.map((c) => (
              <label key={c.id} style={{ fontSize: "13px", display: "flex", gap: "8px", cursor: "pointer", alignItems: "center" }}>
                <input 
                  type="checkbox" 
                  value={String(c.id)} 
                  checked={currentCourseIds.includes(String(c.id))}
                  onChange={() => handleCheckboxChange(c.id)}
                  style={{ accentColor: "#ec4899" }} 
                />
                <span><strong>{c.code}</strong> — {c.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
          <button type="submit" style={{ flex: 1, padding: "12px", background: "#ec4899", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
            {isEditing ? "Update" : "Save"}
          </button>
          {isEditing && (
            <button type="button" onClick={clearSelection} style={{ padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
