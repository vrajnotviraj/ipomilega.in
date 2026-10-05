// Self-check for the signup rules. Run with: node --experimental-strip-types lib/subscribers/signup.check.mjs
import assert from "node:assert/strict";

const { channelWrite, normalizeEmail, normalizePhone, parseSignup, signupTargets } = await import("./signup.ts");

// ---------- Email and phone ----------
assert.deepEqual(normalizeEmail("  Ravi@Gmail.com "), { email: "Ravi@Gmail.com", key: "ravi@gmail.com" }, "email is trimmed and keyed in lowercase");
assert.equal(normalizeEmail("ravi@gmail"), null, "an address without a dot in the domain is rejected");

for (const typed of ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210", "(+91) 98765 43210"]) {
  assert.equal(normalizePhone(typed)?.key, "+919876543210", `"${typed}" normalises to +91 and 10 digits`);
}
for (const typed of ["5876543210", "987654321", "98765432101", "022 2345 6789", "+1 415 555 0100"]) {
  assert.equal(normalizePhone(typed), null, `"${typed}" is not an Indian mobile`);
}

// ---------- Body checks ----------
assert.equal(parseSignup({}).ok, false, "a signup needs an email or a phone");
assert.equal(parseSignup({ email: { $ne: null } }).ok, false, "an operator object is rejected, not stringified");
assert.equal(parseSignup({ email: "ravi@gmail.com", phone: "12345" }).ok, false, "a filled but invalid phone is an error, not dropped");
const phoneOnly = parseSignup({ phone: "98765 43210", page: "https://evil.example" });
assert.equal(phoneOnly.ok && phoneOnly.input.email, null, "a phone alone is enough");
assert.equal(phoneOnly.ok && phoneOnly.input.page, null, "only a site path is kept as the page");

// ---------- Which docs a submit writes ----------
const now = new Date("2026-10-05T04:00:00Z");
const input = (email, phone) => {
  const parsed = parseSignup({ email, phone, form: "popup" });
  assert.ok(parsed.ok);
  return parsed.input;
};
const doc = (id, fields) => ({ _id: id, name: null, email_key: null, email_status: null, phone_key: null, whatsapp_status: null, ...fields });

const ravi = doc("a", { email_key: "ravi@gmail.com", email_status: "active" });
const raviAgain = doc("a", { email_key: "ravi@gmail.com", email_status: "active" });
const priya = doc("b", { phone_key: "+919876543210", whatsapp_status: "active" });

assert.equal(signupTargets(null, null).length, 0, "nothing found means a new doc");
assert.equal(signupTargets(ravi, raviAgain).length, 1, "the same doc found twice is one target");
const split = signupTargets(ravi, priya);
assert.equal(split.length, 2, "an email and a phone held by two people stay on two docs");

const both = input("ravi@gmail.com", "9876543210");
const raviWrite = channelWrite(split[0].doc, both, split[0].claim, now);
assert.equal(raviWrite.set.phone_key, undefined, "the phone is not moved onto the email's doc");
assert.equal(raviWrite.emailActivated, false, "an active email stays as it is and gets no second welcome");
assert.deepEqual(raviWrite.consent.map((event) => event.channel), ["email"], "consent is logged only for the channel the doc took");

const [{ doc: target, claim }] = signupTargets(ravi, null);
const addPhone = channelWrite(target, both, claim, now);
assert.equal(addPhone.set.phone_key, "+919876543210", "a free phone joins the email's doc");
assert.equal(addPhone.set.whatsapp_status, "active", "and its WhatsApp channel turns on");

const unsubscribed = doc("c", { email_key: "ravi@gmail.com", email_status: "unsubscribed" });
const back = channelWrite(unsubscribed, input("RAVI@gmail.com", ""), { email: true, phone: true }, now);
assert.equal(back.set.email_status, "active", "subscribing again after unsubscribing turns the email back on");
assert.equal(back.emailActivated, true, "which sends the welcome mail");
assert.equal(back.filter.email_status, "unsubscribed", "the write only lands if nobody changed the status since it was read");

console.log("signup: all checks passed");
