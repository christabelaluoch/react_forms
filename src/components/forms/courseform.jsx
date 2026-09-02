"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function CourseForm({ selectedCourse, clearSelection }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!selectedCourse;

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (isEditing) {
      reset({
        code: selectedCourse.code || "",
        title: selectedCourse.title || "",
        instructor: selectedCourse.instructor || "",
        credits: selectedCourse.credits || "",
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
        credits: parseInt(formValues.credits, 10),
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
      router.refresh();
    },
    onError: (err) => {
      alert(err?.error?.message || "Server validation failed. Please check inputs.");
    }
  });

  return (
    <div style={{ padding: "24px", background: "#ffffff", borderRadius: "24px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid #f97316", boxSizing: "border-box" }}>
      <h3 style={{ margin: 0, color: "#f97316" }}>
        {isEditing ? "✏️ Edit Course" : "📚 Add Course"}
      </h3>

      <form onSubmit={handleSubmit(v => courseMutation.mutate(v))} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#f97316" }}>Code</label>
          <input name="code" {...register("code")} placeholder="e.g. WEB101" style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#f97316" }}>Title</label>
          <input name="title" {...register("title")} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#f97316" }}>Instructor</label>
          <input name="instructor" {...register("instructor")} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", color: "#f97316" }}>Credits</label>
          <input name="credits" type="number" {...register("credits")} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
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
