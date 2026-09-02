"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function CourseForm({ selectedCourse, clearSelection }) {
  const queryClient = useQueryClient();
  const isEditing = !!selectedCourse;
  const { handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      code: "",
      title: "",
      instructor: "",
      credits: "",
    },
  });


  const currentCode = watch("code");
  const currentTitle = watch("title");
  const currentInstructor = watch("instructor");
  const currentCredits = watch("credits");

  useEffect(() => {
    if (isEditing && selectedCourse) {
      reset({
        code: selectedCourse.code || "",
        title: selectedCourse.title || "",
        instructor: selectedCourse.instructor || "",
        credits: selectedCourse.credits !== undefined ? String(selectedCourse.credits) : "",
      });
    } else {
      reset({ code: "", title: "", instructor: "", credits: "" });
    }
  }, [selectedCourse, isEditing, reset]);

  const courseMutation = useMutation({
    mutationFn: async (formValues) => {
      const url = isEditing
        ? `http://localhost:3000/api/courses/${selectedCourse.id}`
        : "http://localhost:3000/api/courses";
      
      const method = isEditing ? "PATCH" : "POST";
      
      const payloadBody = {
        code: String(formValues.code || "").trim(),
        title: String(formValues.title || "").trim(),
        instructor: String(formValues.instructor || "").trim(),
        credits: parseInt(formValues.credits, 10) || 0,
      };

      const response = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        },
        cache: "no-store",
        body: JSON.stringify(payloadBody)
      });

      const payload = await response.json();
      if (!response.ok) throw payload;
      return payload.data;
    },
    onSuccess: () => {
      alert(isEditing ? "Updated successfully!" : "Created successfully!");
      reset({ code: "", title: "", instructor: "", credits: "" });
      if (isEditing) clearSelection();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      alert(err?.error?.message || "Server validation failed. Please check inputs.");
    }
  });

  const onSubmit = (data) => {
    courseMutation.mutate(data);
  };

  const labelStyle = { display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#f97316" };
  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ padding: "24px", background: "#ffffff", borderRadius: "24px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid #f97316", boxSizing: "border-box" }}>
      <h3 style={{ margin: 0, color: "#f97316" }}>
        {isEditing ? "Edit Course" : " Add Course"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={labelStyle}>Code</label>
          <input 
            type="text" 
            placeholder="e.g. WEB101" 
            value={currentCode}
            onChange={(e) => setValue("code", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Title</label>
          <input 
            type="text" 
            value={currentTitle}
            onChange={(e) => setValue("title", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Instructor</label>
          <input 
            type="text" 
            value={currentInstructor}
            onChange={(e) => setValue("instructor", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Credits</label>
          <input 
            type="number" 
            value={currentCredits}
            onChange={(e) => setValue("credits", e.target.value)}
            style={inputStyle} 
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
          <button type="submit" style={{ flex: 1, padding: "12px", background: "#f97316", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
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
