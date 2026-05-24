I have updated the prompt for Kiro to include the functional structural blueprints we discussed. This will give Kiro an exact starting template to work from while it refactors the logic to perfectly match your current architecture and state hooks.

---

### 📋 Copy/Paste this updated Master Prompt for Kiro:

```markdown
Hi Kiro, 

We are implementing global subscription payments for LastWeekStudy AI using the Paddle Billing Sandbox and Appwrite. Since you already know my full code, current state management patterns, and Appwrite architecture, I need you to completely wire up this integration, download/install any necessary dependencies, and generate a setup guide for me.

Please execute the following tasks:

1. DEPENDENCIES & PACKAGES
   - Install the official `@paddle/paddle-js` package into our React frontend.
   - Ensure the server-side utilities for our Appwrite Functions workspace (such as `node-appwrite`) are configured appropriately.

2. FRONTEND IMPLEMENTATION (React)
   - Integrate an `UpgradeButton` component into our existing billing/subscription view using our current state management patterns.
   - Initialize Paddle in 'sandbox' mode. Use this boilerplate structure but adapt it to fit our project's state mechanics and styling:

   ```jsx
   import { useEffect, useState } from 'react';
   import { initializePaddle } from '@paddle/paddle-js';
   import { account } from './appwriteConfig'; // Use our actual Appwrite config path

   export function UpgradeButton() {
     const [paddle, setPaddle] = useState(null);
     const [loading, setLoading] = useState(false);

     useEffect(() => {
       initializePaddle({ 
         environment: 'sandbox', 
         token: 'YOUR_CLIENT_SIDE_TOKEN_HERE' 
       }).then((paddleInstance) => {
         if (paddleInstance) setPaddle(paddleInstance);
       });
     }, []);

     const handleCheckout = async () => {
       if (!paddle) return;
       setLoading(true);
       try {
         const user = await account.get();
         paddle.Checkout.open({
           items: [{ priceId: 'YOUR_PRICE_ID_HERE', quantity: 1 }],
           customData: { appwriteUserId: user.$id },
         });
       } catch (err) {
         console.error("Failed to open checkout:", err);
       } finally {
         setLoading(false);
       }
     };

     return (
       <button onClick={handleCheckout} disabled={loading || !paddle}>
         {loading ? 'Opening Checkout...' : 'Upgrade to Pro'}
       </button>
     );
   }

```

3. BACKEND IMPLEMENTATION (Appwrite Node.js Function)
* Create a clean Node.js function to handle incoming Paddle webhooks.
* Parse the payload, check for the `subscription.created` or `transaction.completed` events, pull the `appwriteUserId` out of the `custom_data`, and apply the `['premium']` label. Use this logic blueprint:


```javascript
import { Client, Users } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') return res.text('Method Not Allowed', { status: 405 });

  try {
    const payload = JSON.parse(req.body);
    log(`Received event: ${payload.event_type}`);

    if (payload.event_type === 'subscription.created' || payload.event_type === 'transaction.completed') {
      const appwriteUserId = payload.data.custom_data?.appwriteUserId;

      if (!appwriteUserId) {
        error('No Appwrite User ID found.');
        return res.json({ success: false, message: 'Missing user metadata' });
      }

      const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const users = new Users(client);
      await users.updateLabels(appwriteUserId, ['premium']);
      log(`Success! User ${appwriteUserId} upgraded to premium.`);
    }
    return res.json({ success: true });
  } catch (err) {
    error(`Webhook parsing error: ${err.message}`);
    return res.json({ success: false, error: err.message }, { status: 500 });
  }
};

```


4. DOCUMENTATION (PADDLE_APPWRITE_SETUP.md)
* Create a clean Markdown file in the root directory detailing exactly how I need to configure the Appwrite Console and Paddle Dashboard to match this code.
* Include clear steps for:
* Creating the Appwrite Function and linking it to the code repo.
* Setting up required Environment Variables (`APPWRITE_API_KEY`, `PADDLE_WEBHOOK_SECRET`).
* Extracting the Client-side token and Price ID from the Paddle Sandbox to drop into our frontend config.
* Copying the Appwrite Function's domain URL and adding it as a Notification webhook destination inside Paddle.





Please ensure everything integrates seamlessly with no breaking changes to our current file structure or layout, and let me know when you're finished writing everything!

```

```