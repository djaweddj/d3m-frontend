import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockSchools } from "../data/mockData";
import { useAuth } from "../context/mockAuth";

// ── Small helpers ──────────────────────────────────────────
function Badge({ children }) {
  return (
    <span
      style={{
        background: "#f1f5f9",
        color: "#475569",
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 6,
        border: "0.5px solid #e2e8f0",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function InfoRow({ emoji, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
        {emoji}
      </span>

      <div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: "#0f172a",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function GreenDot({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#1D9E75",
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 13, color: "#1D9E75" }}>
        {children}
      </span>
    </div>
  );
}

// ── Success toast ──────────────────────────────────────────
function Toast({ name }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0F172A",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 12,
        fontSize: 13,
        fontFamily: "inherit",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        border: "1px solid rgba(255,255,255,.1)",
        animation: "slideUp .3s ease",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#1D9E75",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        ✓
      </span>

      تم إرسال طلب التسجيل في{" "}
      <strong style={{ color: "#B5D4F4" }}>{name}</strong> بنجاح!

      <style>{`
        @keyframes slideUp {
          from {
            opacity:0;
            transform:translate(-50%,12px)
          }
          to {
            opacity:1;
            transform:translate(-50%,0)
          }
        }
      `}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requested, setRequested] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const school = mockSchools.find((s) => s.id === id);

  const handleRegister = () => {
    setRequested(true);
    setShowToast(true);

    setTimeout(() => setShowToast(false), 3500);
  };

  if (!school)
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui,Arial,sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "0.5px solid #e2e8f0",
            padding: "2rem",
            maxWidth: 360,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            المدرسة غير موجودة
          </h2>

          <button
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              background: "#185FA5",
              color: "#fff",
              border: "none",
              fontSize: 14,
              cursor: "pointer",
              marginTop: 12,
            }}
            onClick={() => navigate("/schools")}
          >
            العودة للتصفح
          </button>
        </div>
      </div>
    );

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "system-ui,Arial,sans-serif",
        paddingBottom: "3rem",
      }}
    >
      {/* Toast */}
      {showToast && <Toast name={school.name} />}

      {/* Breadcrumb */}
      <div
        style={{
          background: "#fff",
          borderBottom: "0.5px solid #e2e8f0",
          padding: "0.5rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        <span
          style={{ color: "#185FA5", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          الرئيسية
        </span>

        <span>›</span>

        <span
          style={{ color: "#185FA5", cursor: "pointer" }}
          onClick={() => navigate("/schools")}
        >
          تصفح المدارس
        </span>

        <span>›</span>

        <span style={{ color: "#0f172a" }}>
          {school.name}
        </span>
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "2rem",
        }}
      >
        {/* ── Left column ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Hero image */}
          <div
            style={{
              position: "relative",
              height: 280,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <img
              src={school.image}
              alt={school.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "#fff",
                borderRadius: 999,
                padding: "5px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "0.5px solid #e2e8f0",
              }}
            >
              <span style={{ color: "#BA7517", fontSize: 16 }}>
                ★
              </span>

              <span style={{ fontWeight: 500, fontSize: 15 }}>
                {school.rating}
              </span>
            </div>
          </div>

          {/* Info card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "0.5px solid #e2e8f0",
              padding: "1.5rem",
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 6px",
              }}
            >
              {school.name}
            </h1>

            <div
              style={{
                color: "#64748b",
                fontSize: 14,
                marginBottom: "1.5rem",
              }}
            >
              📍 {school.location}
            </div>

            <h3
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 8px",
              }}
            >
              نبذة عن المدرسة
            </h3>

            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                lineHeight: 1.7,
                margin: "0 0 1.5rem",
              }}
            >
              {school.description}
            </p>

            <hr
              style={{
                border: "none",
                borderTop: "0.5px solid #e2e8f0",
                margin: "0 0 1.25rem",
              }}
            />

            <h3
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 10px",
              }}
            >
              المواد الدراسية
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: "1.5rem",
              }}
            >
              {school.subjects.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "0.5px solid #e2e8f0",
                margin: "0 0 1.25rem",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <InfoRow
                emoji="👨‍🏫"
                label="الأستاذ المشرف"
                value={school.teacher}
              />

              <InfoRow
                emoji="🕐"
                label="أوقات الدراسة"
                value={school.schedule}
              />

              <InfoRow
                emoji="📞"
                label="رقم الهاتف"
                value={school.contact}
              />

              <InfoRow
                emoji="👥"
                label="عدد الطلاب"
                value={`${school.students} طالب مسجل`}
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "0.5px solid #e2e8f0",
              padding: "1.5rem",
              position: "sticky",
              top: 72,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 4px",
              }}
            >
              سجل الآن
            </h2>

            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                margin: "0 0 1.25rem",
              }}
            >
              انضم إلى {school.students} طالب
            </p>

            {/* Price */}
            <div
              style={{
                background: "#EBF4FE",
                borderRadius: 8,
                padding: "1rem",
                textAlign: "center",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  color: "#185FA5",
                }}
              >
                {school.price} درهم
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#185FA5",
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                رسوم شهرية
              </div>
            </div>

            {/* Student greeting */}
            {user?.role === "student" && !requested && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "#E1F5EE",
                  border: "1px solid #5DCAA5",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#0F6E56",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {user.avatar ||
                    user.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                </div>

                <span
                  style={{
                    fontSize: 12,
                    color: "#085041",
                    fontWeight: 500,
                  }}
                >
                  مرحباً {user.name.split(" ")[0]}، يمكنك التسجيل مباشرة
                </span>
              </div>
            )}

            {/* Register area */}
            {requested ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>
                  ✅
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0F6E56",
                    marginBottom: 2,
                  }}
                >
                  تم إرسال الطلب!
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                  }}
                >
                  ستتلقى رداً من المدرسة قريباً
                </div>
              </div>
            ) : user?.role === "student" ? (
              <button
                onClick={handleRegister}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  background: "#185FA5",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.opacity = ".88")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = "1")
                }
              >
                سجل كطالب
              </button>
            ) : (
              <div
                style={{
                  background: "#F8FAFC",
                  borderRadius: 12,
                  border: "1.5px dashed #CBD5E1",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#EBF4FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontSize: 20,
                  }}
                >
                  🔒
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0F172A",
                    marginBottom: 6,
                  }}
                >
                  يجب تسجيل الدخول
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    lineHeight: 1.7,
                    margin: "0 0 14px",
                  }}
                >
                  للتسجيل في هذه المدرسة يجب أن تمتلك حساب طالب.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 8,
                      background: "#185FA5",
                      color: "#fff",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    تسجيل الدخول
                  </button>

                  <button
                    onClick={() => navigate("/signup")}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#185FA5",
                      border: "1.5px solid #185FA5",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    إنشاء حساب
                  </button>
                </div>
              </div>
            )}

            {!requested && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#94a3b8",
                  margin: "8px 0 1rem",
                }}
              >
                التسجيل سريع وسهل
              </p>
            )}

            <hr
              style={{
                border: "none",
                borderTop: "0.5px solid #e2e8f0",
                margin: requested ? "1rem 0" : "0 0 1rem",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <GreenDot>مدرسة معتمدة</GreenDot>
              <GreenDot>أساتذة مؤهلون</GreenDot>
              <GreenDot>متابعة مستمرة</GreenDot>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}