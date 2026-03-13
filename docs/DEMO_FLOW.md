# KiasuHealth: Telegram Bot Demo Flow 🏆🇸🇬

This is the recommended "Cinematic" demo script for the KiasuHealth Telegram bot. It highlights the core value props: **social pressure (Kiasu)**, **local SG integration**, and **personalized health coaching**.

---

## Preparation
1. Ensure `.env.local` has `MOCK_RESPONSE=true` and `NEXT_PUBLIC_APP_URL` set.
2. Join a league first using `/join KIASU01`.

---

## Phase 1: The "Kiasu" Check (Social Accountability)
**Narrative**: You've just woken up and want to see if you can take it easy today. But your kakis are already active.

*   **Prompt**: `/ask how are my kakis doing?`
*   **Expected Response**:
    > "Eh, you want to know how your kakis are doing? 🧐
    >
    > *League Intelligence:* 
    > • **Ahmad** is currently 'Chionging' — he hit 5,000 steps before 9am today. Level up leh! 
    > • **Siti** had a solid economy rice lunch (Score: 9/10). She's catching up on your nutrition lead.
    > • **Wei Ming** is your biggest threat for the #1 spot...
    >
    > *Kiasu Tip:* If you clock a 20-min session at the **ActiveSG Gym @ Jurong West** tonight, you'll earn enough bonus points... 🏆"

---

## Phase 2: Lunch Time (The Meal Analyzer)
**Narrative**: You're at a Japanese eatery and want to see if your "healthy" choice actually counts.

*   **Action**: Upload a photo of **Mentaiko Salmon** (or any Japanese dish) with the caption `/photo`.
*   **Expected Response**:
    > "🔍 Analyzing your meal...
    >
    > I see a delicious Mentaiko Salmon dish! 🍣 The protein-to-veg ratio is solid thanks to those pickles and seaweed... A very balanced meal that keeps you in the Kiasu Champion race!
    >
    > **Nutritional Estimates:**
    > 🥩 Protein: 32g
    > 🍚 Carbs: 45g
    > 🥑 Fat: 22g
    > 🥬 Fiber: 4g"

---

## Phase 3: Stepping Up (Local Integration)
**Narrative**: You realized Ahmad is still leading in steps. You need a place to walk that "counts" for the league.

*   **Prompt**: `/ask where can I walk to beat Ahmad?`
*   **Expected Response**:
    > "Wah, you're doing steady lah! 🏃‍♂️
    >
    > *Your Trends (Past 7 Days):*
    > • Average Steps: 10,245 (Up 15% from last week!)
    >
    > *Recommendation:* Since you're near Ang Mo Kio, why not try the **AMK Heritage Trail** later? It's a nice 4km loop that'll help you overtake Ahmad by tonight. Don't play play! 🔥"

---

## Phase 4: Finding Nearby Challenges
**Narrative**: You're in town and want a location-based challenge to earn extra badges.

*   **Prompt**: `/ask are there any parks near Marina Bay?`
*   **Expected Response**:
    > "Look like you're near **Marina Bay**? 🌉
    >
    > Since your 'Activity' score is a bit low this week, why not try the **Waterfront Promenade**? 
    > 🚶‍♂️ **Challenge:** A full loop is ~3.5km (approx 4,500 steps). 
    > 🎁 **Reward:** If you finish it before sunset, you'll unlock the *'Scenic Explorer'* badge...
    >
    > Go walk-walk a bit lah, don't just sit in office! 🏢"

---

## Phase 5: The Grand Reveal (Group Chat)
**Narrative**: Sunday arrives. You trigger the final standings in your Kakis group chat.

*   **Action**: In a group chat (or mock it in DM), type `/reveal`.
*   **Expected Response**:
    > "🔍 Tallying the scores and asking the Referee...
    >
    > 🏆 *Week Reveal — sg-league-001*
    > #1 **Wei Ming** — 77.4 pts Kiasu Champion 🏆
    > #2 **Ahmad** — 74.5 pts Most Improved 📈
    > ...
    >
    > 👀 *Full reveal*: https://your-app.vercel.app/league/sg-league-001/reveal"

---

**Pro Tip**: Mention that the "Kiasu Voice" (The Singlish) is part of our **KiasuRefereeAgent's** persona, designed to maximize Singaporean engagement!
