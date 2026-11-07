import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronRight, X } from "lucide-react";
import TopBar from "../../layout/TopBar";
import Header from "../../layout/Header";
import Navbar from "../../layout/Navbar";
import styles from "./Workflow.module.css";

export const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
export const number = (value: number) => value.toLocaleString("vi-VN");
export const date = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
export function WorkflowError({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div role="alert" className={styles.error}>
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && (
        <button type="button" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className={styles.empty}>
      <BookOpen size={34} />
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
    </div>
  );
}
export function WorkflowModal({
  title,
  children,
  onClose,
  busy = false,
  sheet = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  sheet?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${sheet ? styles.sheet : ""}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className={styles.dialogHeading}>
        <h2>{title}</h2>
        <button
          type="button"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function MemberShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <>
      <TopBar />
      <Header />
      <Navbar />
      <main className={styles.memberContainer}>
        <div className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={13} />
          <span>Tài khoản của tôi</span>
          <ChevronRight size={13} />
          <span>{title}</span>
        </div>
        <section className={styles.memberMain}>
          <div className={styles.pageHeading}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </section>
      </main>
    </>
  );
}
