// Public certificate verification page. The QR on every certificate points here.
// Server component: it fetches the backend directly, so there is no CORS hop and
// no API URL exposed to the browser.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Result = {
  valid: boolean;
  code?: string;
  name?: string;
  course?: string;
  issuer?: string;
  issued_at?: string | null;
};

async function verify(code: string): Promise<Result> {
  try {
    const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(code)}`, {
      // Always check live — a revoked or newly issued certificate must not be
      // served from a stale cache.
      cache: "no-store",
    });
    if (!res.ok) return { valid: false };
    return (await res.json()) as Result;
  } catch {
    return { valid: false };
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const r = await verify(code);
  const issued = formatDate(r.issued_at);

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-sm font-bold tracking-[0.3em] uppercase text-emerald-600">
            Cosmoplex
          </div>
          <div className="mx-auto mt-2 h-[3px] w-12 rounded bg-emerald-600" />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          {r.valid ? (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                    <path
                      d="M4.5 12.5l5 5 10-11"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 className="mt-4 text-xl font-semibold text-zinc-900">
                  Verified certificate
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  This certificate was issued by Cosmoplex and is genuine.
                </p>
              </div>

              <dl className="mt-7 space-y-4 border-t border-zinc-100 pt-6">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                    Awarded to
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-900">{r.name}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                    Course
                  </dt>
                  <dd className="mt-1 text-zinc-800">{r.course}</dd>
                </div>
                {issued && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                      Issued
                    </dt>
                    <dd className="mt-1 text-zinc-800">{issued}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                    Certificate ID
                  </dt>
                  <dd className="mt-1 font-mono text-sm tracking-wide text-emerald-700">
                    {r.code}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-zinc-50">
                <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                  <path
                    d="M7 7l10 10M17 7L7 17"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-semibold text-zinc-900">
                Certificate not found
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                We couldn&apos;t find a certificate with the ID{" "}
                <span className="font-mono text-zinc-700">{code}</span>. Please check
                the code printed on the certificate and try again.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Verify any Cosmoplex certificate at ailiteracy.cosmoplex.ai/verify
        </p>
      </div>
    </main>
  );
}
