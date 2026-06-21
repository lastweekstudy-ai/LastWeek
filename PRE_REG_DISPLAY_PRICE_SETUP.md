# Pre-Registration Display Price Setup

The admin panel can now edit the website copy for the pre-registration offer without changing Paddle checkout logic.

Add these optional attributes to the `admin_settings` collection/table in Appwrite:

| Attribute | Type | Required | Suggested default |
| --- | --- | --- | --- |
| `preRegDisplayPrice` | Float | No | `4` |
| `preRegDisplayValue` | Float | No | `108` |

`preRegDisplayPrice` controls public copy such as `Pay $4 now` and `Pre-Register ($4)`.

`preRegDisplayValue` controls public copy such as `a $108 value`.

Payment logic still uses `preRegPriceId` / `VITE_PADDLE_PRE_REG_PRICE_ID`, so you still need to change the actual amount in Paddle by creating or selecting the correct Paddle one-time price.
