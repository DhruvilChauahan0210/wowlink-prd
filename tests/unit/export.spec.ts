import { expect, test } from "@playwright/test";
import { csvName, headcountCsv, invitationsCsv, repliesCsv, toCsv } from "../../app/lib/export";
import type { Experience, Rsvp } from "../../app/lib/store";

const experience: Experience = {
  id: "x", slug: "abc1234", templateId: "wedding", status: "published", createdAt: "", updatedAt: "",
  title: "Isha & Kabir", date: "2026-11-08", time: "18:00", venue: "The Garden House, Surat", message: "",
  events: [
    { id: "reception", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" },
    { id: "mehndi", name: "Mehndi", date: "2026-11-06", time: "", venue: "Patel home" },
  ],
  publicEvents: "all",
  guests: [{ id: "bcdfghjk", name: "the Patel family", events: ["reception"], createdAt: "", phone: "919825012345" }],
};
const rsvps: Rsvp[] = [
  { id: "1", experienceId: "x", name: "Rameshbhai", attendance: "Attending", guestCount: 4, guestId: "bcdfghjk", createdAt: "2026-10-20T06:30:00Z", byEvent: { reception: { attendance: "Attending", guestCount: 4 } } },
  { id: "2", experienceId: "x", name: "=HYPERLINK(\"evil\")", attendance: "Maybe", guestCount: 2, createdAt: "2026-10-21T06:30:00Z", byEvent: { mehndi: { attendance: "Maybe", guestCount: 2 }, reception: { attendance: "Not attending", guestCount: 0 } } },
];
const lines = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n");

test("CSV: a byte-order mark for Excel, quoting, and no formulas from guests' names", () => {
  const csv = toCsv([["a", "b, c", "say \"hi\""], ["=1+1", "+91", "-2", "@x", 5]]);
  expect(csv.startsWith("﻿")).toBe(true);
  expect(lines(csv)).toEqual(["a,\"b, c\",\"say \"\"hi\"\"\"", "'=1+1,'+91,'-2,'@x,5"]);
});

test("every reply, with a column per celebration in date order", () => {
  const [header, patel, other] = lines(repliesCsv({ experience, rsvps }));
  expect(header).toBe("Name,Household,Reply,People,\"Mehndi (Fri, 6 Nov)\",\"Reception (Sun, 8 Nov)\",Sent");
  // The Patels weren't invited to the Mehndi: blank, not "No".
  expect(patel).toBe("Rameshbhai,the Patel family,Attending,4,,4,\"20 Oct 2026, 12:00 pm\"");
  expect(other).toBe("\"'=HYPERLINK(\"\"evil\"\")\",,Maybe,2,Maybe (2),No,\"21 Oct 2026, 12:00 pm\"");
});

test("the caterer's headcount, one row per celebration", () => {
  const [header, mehndi, reception] = lines(headcountCsv({ experience, rsvps }));
  expect(header).toContain("Coming (people)");
  expect(mehndi).toBe("Mehndi,\"Fri, 6 Nov\",All day,Patel home,0,0,2,1,0,0");
  expect(reception).toBe("Reception,\"Sun, 8 Nov\",9:00 PM,\"The Garden House, Surat\",4,1,0,0,1,0");
});

test("the invitation list, with links and numbers that stay text", () => {
  const [header, patel] = lines(invitationsCsv({ experience, rsvps }, "https://wowlink.example"));
  expect(header).toBe("Household,Link,WhatsApp,Celebrations,Opened,Reply,People,Replied on");
  expect(patel).toBe("the Patel family,https://wowlink.example/e/abc1234/bcdfghjk,91 98250 12345,Reception,Not yet,Attending,4,\"20 Oct 2026, 12:00 pm\"");
  expect(csvName("Isha & Kabir", "replies")).toBe("isha-kabir-replies.csv");
  expect(csvName("રમેશ", "replies")).toBe("invitation-replies.csv");
});
