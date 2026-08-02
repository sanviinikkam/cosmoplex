"""
Lightweight "does this email domain actually exist" check for signup.

Confirms the domain can plausibly receive mail (has an MX record, or an A/AAAA
record as the RFC 5321 implicit-MX fallback) — catches typos like gmial.com or
made-up domains. This does NOT confirm the specific mailbox exists or that the
signer-upper owns it; a full ownership check would need a confirmation
email/OTP, which is a separate, bigger feature requiring an email-sending
provider.
"""
import asyncio
import functools

import dns.resolver

# Skip the DNS round trip for the huge majority of signups — these are always valid.
_KNOWN_GOOD_DOMAINS = frozenset({
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "protonmail.com", "aol.com", "live.com", "rediffmail.com", "yahoo.co.in",
})


@functools.lru_cache(maxsize=4096)
def _domain_has_mail_server(domain: str) -> bool:
    """Sync + cached — call via domain_can_receive_mail(), never directly from
    an async context (DNS lookups block). False only on a definitive
    NXDOMAIN/NoAnswer for BOTH MX and A records. Any other resolver error
    (timeout, network hiccup) fails OPEN so a transient DNS issue never blocks
    a legitimate signup."""
    resolver = dns.resolver.Resolver()
    resolver.lifetime = 4.0
    try:
        resolver.resolve(domain, "MX")
        return True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        pass
    except Exception:
        return True
    try:
        resolver.resolve(domain, "A")
        return True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        return False
    except Exception:
        return True


async def domain_can_receive_mail(email: str) -> bool:
    """True if `email`'s domain can plausibly receive mail. Runs the blocking
    DNS lookup in a thread so it never stalls the event loop."""
    domain = email.rsplit("@", 1)[-1].strip().lower().rstrip(".")
    if not domain:
        return False
    if domain in _KNOWN_GOOD_DOMAINS:
        return True
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _domain_has_mail_server, domain)
