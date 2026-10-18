import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/database";

const app = createApp();

describe("DinePilot Full-Stack API Acceptance & Security Suite", () => {
  let ownerAToken = "";
  let restaurantAId = "";
  let restaurantASlug = "";
  let categoryAId = "";
  let menuItemAId = "";
  let disabledItemAId = "";
  let tableAPublicToken = "";
  let createdOrderId = "";
  let publicOrderToken = "";
  let ingredientOnionId = "";
  let ingredientPaneerId = "";

  let ownerBToken = "";
  let restaurantBId = "";

  beforeAll(async () => {
    await connectDatabase({ inMemoryOnly: true });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("1 & 2. Owner A registers a restaurant in Nagpur and logs in successfully", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ownerName: "Rohit Deshmukh",
        email: "rohit@nagpurbistro.in",
        password: "Password@123",
        phone: "+91 98230 11223",
        restaurantName: "Nagpur Spice Courtyard",
        city: "Nagpur",
        state: "Maharashtra",
        gstin: "27AABCN1234F1Z5",
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.restaurant.city).toBe("Nagpur");

    restaurantAId = regRes.body.data.restaurant.id;
    restaurantASlug = regRes.body.data.restaurant.slug;

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "rohit@nagpurbistro.in",
      password: "Password@123",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeTruthy();
    ownerAToken = loginRes.body.data.token;

    const tablesRes = await request(app)
      .get("/api/v1/tables")
      .set("Authorization", `Bearer ${ownerAToken}`);
    expect(tablesRes.status).toBe(200);
    expect(tablesRes.body.data.length).toBeGreaterThanOrEqual(2);
    tableAPublicToken = tablesRes.body.data[0].publicToken;
  });

  it("3. Owner A adds categories, adds/edits a menu item, and disables an unavailable item", async () => {
    const catRes = await request(app)
      .post("/api/v1/menu/categories")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: "Saoji Mains",
        description: "Authentic Nagpur curries",
        sortOrder: 1,
      });
    expect(catRes.status).toBe(201);
    categoryAId = catRes.body.data._id;

    const itemRes = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        categoryId: categoryAId,
        name: "Saoji Paneer Handi",
        description: "Spicy Vidarbha paneer curry",
        pricePaise: 30000,
        packagingCostPaise: 1500,
        dietaryType: "VEG",
        spiceLevel: "SAOJI_FIERY",
        isAvailable: true,
      });
    expect(itemRes.status).toBe(201);
    menuItemAId = itemRes.body.data._id;

    const editRes = await request(app)
      .patch(`/api/v1/menu/${menuItemAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ pricePaise: 32000 });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.pricePaise).toBe(32000);

    const item2Res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        categoryId: categoryAId,
        name: "Seasonal Santra Kulfi",
        pricePaise: 15000,
        dietaryType: "VEG",
        isAvailable: true,
      });
    disabledItemAId = item2Res.body.data._id;

    const disableRes = await request(app)
      .patch(`/api/v1/menu/${disabledItemAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ isAvailable: false });
    expect(disableRes.status).toBe(200);
    expect(disableRes.body.data.isAvailable).toBe(false);
  });

  it("14 & 15. Owner A sets up ingredients, auditable movements, and yield-adjusted recipes", async () => {
    const ing1Res = await request(app)
      .post("/api/v1/inventory/ingredients")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: "Fresh Paneer",
        unit: "kg",
        currentStock: 10,
        reorderThreshold: 3,
        costPerUnitPaise: 40000,
        usableYieldPercent: 100,
      });
    expect(ing1Res.status).toBe(201);
    ingredientPaneerId = ing1Res.body.data._id;

    const ing2Res = await request(app)
      .post("/api/v1/inventory/ingredients")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: "Red Onion",
        unit: "kg",
        currentStock: 20,
        reorderThreshold: 5,
        costPerUnitPaise: 5000,
        usableYieldPercent: 80,
      });
    expect(ing2Res.status).toBe(201);
    ingredientOnionId = ing2Res.body.data._id;

    const badRecipeRes = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        menuItemId: menuItemAId,
        yieldServings: 1,
        components: [
          {
            ingredientId: ingredientPaneerId,
            quantity: 200,
            unit: "ml",
          },
        ],
      });
    expect(badRecipeRes.status).toBe(400);
    expect(badRecipeRes.body.error.code).toBe("INVALID_UNIT_CONVERSION");

    const recipeRes = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        menuItemId: menuItemAId,
        yieldServings: 1,
        prepInstructions: "Simmer paneer in Saoji onion gravy",
        components: [
          {
            ingredientId: ingredientPaneerId,
            quantity: 200,
            unit: "g",
          },
          {
            ingredientId: ingredientOnionId,
            quantity: 160,
            unit: "g",
          },
        ],
      });
    expect(recipeRes.status).toBe(201);
    expect(recipeRes.body.data.ingredientCostPerServingPaise).toBe(9000);
    expect(recipeRes.body.data.estimatedGrossProfitPaise).toBe(21500);
    expect(recipeRes.body.data.foodCostPercentage).toBe(28.13);
  });

  it("4, 5, 6, 7, 8 & 16. Guest opens public QR menu, validates table token, submits order with idempotency, and server recalculates GST total", async () => {
    const pubMenuRes = await request(app).get(
      `/api/v1/public/restaurants/${restaurantASlug}/menu`
    );
    expect(pubMenuRes.status).toBe(200);
    expect(pubMenuRes.body.data.items.length).toBe(2);

    const tblVerifyRes = await request(app).get(
      `/api/v1/public/restaurants/${restaurantASlug}/tables/${tableAPublicToken}`
    );
    expect(tblVerifyRes.status).toBe(200);
    expect(tblVerifyRes.body.data.table.label).toBe("T-01");

    const disabledOrderRes = await request(app)
      .post(`/api/v1/public/restaurants/${restaurantASlug}/orders`)
      .send({
        orderType: "DINE_IN",
        tablePublicToken: tableAPublicToken,
        items: [{ menuItemId: disabledItemAId, quantity: 1 }],
      });
    expect(disabledOrderRes.status).toBe(400);
    expect(disabledOrderRes.body.error.code).toBe("ITEM_UNAVAILABLE");

    const orderPayload = {
      orderType: "DINE_IN",
      tablePublicToken: tableAPublicToken,
      customerName: "Nikhil Gadkari",
      customerPhone: "+91 98220 77889",
      marketingConsent: true,
      idempotencyKey: "guest-idem-key-001",
      items: [{ menuItemId: menuItemAId, quantity: 2 }],
    };

    const orderRes1 = await request(app)
      .post(`/api/v1/public/restaurants/${restaurantASlug}/orders`)
      .send(orderPayload);

    expect(orderRes1.status).toBe(201);
    expect(orderRes1.body.data.subtotalPaise).toBe(64000);
    expect(orderRes1.body.data.cgstPaise).toBe(1600);
    expect(orderRes1.body.data.sgstPaise).toBe(1600);
    expect(orderRes1.body.data.totalPaise).toBe(67200);
    publicOrderToken = orderRes1.body.data.publicOrderToken;

    const orderRes2 = await request(app)
      .post(`/api/v1/public/restaurants/${restaurantASlug}/orders`)
      .send(orderPayload);
    expect(orderRes2.status).toBe(201);
    expect(orderRes2.body.data.orderNumber).toBe(
      orderRes1.body.data.orderNumber
    );
  });

  it("9, 10, 11 & 12. Order appears in dashboard, rejects invalid transitions, transitions through state machine, deducts inventory idempotently, and updates guest tracker", async () => {
    const listRes = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${ownerAToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    createdOrderId = listRes.body.data[0]._id;

    const badTransRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "COMPLETED" });
    expect(badTransRes.status).toBe(400);
    expect(badTransRes.body.error.code).toBe("INVALID_STATE_TRANSITION");

    const acceptRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "ACCEPTED" });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe("ACCEPTED");
    expect(acceptRes.body.data.inventoryConsumed).toBe(true);

    await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "ACCEPTED" });

    const ingRes = await request(app)
      .get("/api/v1/inventory/ingredients")
      .set("Authorization", `Bearer ${ownerAToken}`);
    const paneer = ingRes.body.data.find(
      (i: { _id: string }) => i._id === ingredientPaneerId
    );
    expect(paneer.currentStock).toBe(9.6);

    await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "PREPARING" });
    await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "READY" });
    const completeRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({ status: "COMPLETED" });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe("COMPLETED");

    const trackRes = await request(app).get(
      `/api/v1/public/orders/${publicOrderToken}`
    );
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.status).toBe("COMPLETED");
    expect(trackRes.body.data.statusEvents.length).toBe(5);
  });

  it("13. Enforces strict multi-tenant isolation (Restaurant B cannot access Restaurant A orders or menu)", async () => {
    const regB = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ownerName: "Owner B",
        email: "ownerb@othercafe.in",
        password: "Password@123",
        restaurantName: "Other Cafe Sitabuldi",
      });
    expect(regB.status).toBe(201);
    ownerBToken = regB.body.data.token;
    restaurantBId = regB.body.data.restaurant.id;
    expect(restaurantBId).not.toBe(restaurantAId);

    const crossOrderRes = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${ownerBToken}`);
    expect(crossOrderRes.status).toBe(404);

    const spoofHeaderRes = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${ownerBToken}`)
      .set("x-restaurant-id", restaurantAId);
    expect(spoofHeaderRes.status).toBe(403);
    expect(spoofHeaderRes.body.error.code).toBe("CROSS_TENANT_ACCESS_DENIED");

    const platformAttempt = await request(app)
      .get("/api/v1/platform/overview")
      .set("Authorization", `Bearer ${ownerBToken}`);
    expect(platformAttempt.status).toBe(403);
    expect(platformAttempt.body.error.code).toBe("PLATFORM_ADMIN_REQUIRED");
  });

  it("Tests concurrent stock updates and simultaneous reservation attempts without race conditions", async () => {
    const concurrentMoves = Array.from({ length: 5 }, (_, idx) =>
      request(app)
        .post("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${ownerAToken}`)
        .send({
          ingredientId: ingredientOnionId,
          type: "WASTE",
          quantity: 1,
          unit: "kg",
          reason: `Concurrent waste log #${idx + 1}`,
        })
    );

    const moveResults = await Promise.all(concurrentMoves);
    for (const r of moveResults) {
      expect(r.status).toBe(201);
    }

    const ingRes = await request(app)
      .get("/api/v1/inventory/ingredients")
      .set("Authorization", `Bearer ${ownerAToken}`);
    const onion = ingRes.body.data.find(
      (i: { _id: string }) => i._id === ingredientOnionId
    );
    expect(onion.currentStock).toBe(14.6);

    const tablesRes = await request(app)
      .get("/api/v1/tables")
      .set("Authorization", `Bearer ${ownerAToken}`);
    const targetTableId = tablesRes.body.data[0]._id;

    const [rsv1, rsv2] = await Promise.all([
      request(app)
        .post("/api/v1/reservations")
        .set("Authorization", `Bearer ${ownerAToken}`)
        .send({
          customerName: "Guest One",
          customerPhone: "+91 90000 11111",
          date: "2026-10-25",
          timeSlot: "19:30",
          partySize: 4,
          tableId: targetTableId,
        }),
      request(app)
        .post("/api/v1/reservations")
        .set("Authorization", `Bearer ${ownerAToken}`)
        .send({
          customerName: "Guest Two",
          customerPhone: "+91 90000 22222",
          date: "2026-10-25",
          timeSlot: "19:30",
          partySize: 4,
          tableId: targetTableId,
        }),
    ]);

    const statuses = [rsv1.status, rsv2.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});
