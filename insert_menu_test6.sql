-- Script to insert full menu for restaurant 'test6' check

-- 1. Get the Restaurant ID
DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_entree_id UUID;
    v_cat_plat_id UUID;
    v_cat_dessert_id UUID;
    v_cat_boisson_id UUID;
BEGIN
    -- Find restaurant by slug
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'test6';

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Restaurant test6 not found';
    END IF;

    -- 2. Clear existing items for cleanliness (Optional - Remove if you want to verify duplicates only)
    -- DELETE FROM items WHERE restaurant_id = v_restaurant_id;
    -- DELETE FROM menus_categories WHERE restaurant_id = v_restaurant_id;

    -- 3. Insert Categories or Get Existing IDs
    -- We use ON CONFLICT (name, restaurant_id) DO UPDATE SET name=EXCLUDED.name RETURNING id
    -- if unique constraint exists. If not, we select before insert.
    -- Assuming idx_unique_category_per_restaurant exists now.

    -- Entrées
    INSERT INTO menus_categories (name, display_order, restaurant_id) 
    VALUES ('Entrées', 1, v_restaurant_id) 
    ON CONFLICT (restaurant_id, lower(name)) DO UPDATE SET display_order = 1 
    RETURNING id INTO v_cat_entree_id;

    -- Plats
    INSERT INTO menus_categories (name, display_order, restaurant_id) 
    VALUES ('Plats', 2, v_restaurant_id) 
    ON CONFLICT (restaurant_id, lower(name)) DO UPDATE SET display_order = 2 
    RETURNING id INTO v_cat_plat_id;

    -- Desserts
    INSERT INTO menus_categories (name, display_order, restaurant_id) 
    VALUES ('Desserts', 3, v_restaurant_id) 
    ON CONFLICT (restaurant_id, lower(name)) DO UPDATE SET display_order = 3 
    RETURNING id INTO v_cat_dessert_id;

    -- Boissons
    INSERT INTO menus_categories (name, display_order, restaurant_id) 
    VALUES ('Boissons', 4, v_restaurant_id) 
    ON CONFLICT (restaurant_id, lower(name)) DO UPDATE SET display_order = 4 
    RETURNING id INTO v_cat_boisson_id;

    -- 4. Insert Items (Using IDs retrieved above)
    
    -- Entrées
    INSERT INTO items (name, description, price, category_id, restaurant_id, image_url, is_available) VALUES
    ('Burrata des Pouilles', 'Servie avec tomates cerises, basilic frais et huile d''olive extra vierge.', 16.00, v_cat_entree_id, v_restaurant_id, 'https://images.unsplash.com/photo-1608039755401-742778f5c439?auto=format&fit=crop&q=80', true),
    ('Carpaccio de Bœuf', 'Tranches fines de bœuf charolais, parmesan, roquette et citron.', 18.50, v_cat_entree_id, v_restaurant_id, 'https://images.unsplash.com/photo-1547496502-ffa22d388b74?auto=format&fit=crop&q=80', true),
    ('Velouté de Potimarron', 'Crème de châtaigne et éclats de noisettes torréfiées.', 12.00, v_cat_entree_id, v_restaurant_id, 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2b?auto=format&fit=crop&q=80', true);

    -- Plats
    INSERT INTO items (name, description, price, category_id, restaurant_id, image_url, model_3d_glb, is_available) VALUES
    ('Burger Signature', 'Steak Black Angus, cheddar affiné, bacon croustillant et sauce secrète.', 22.00, v_cat_plat_id, v_restaurant_id, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', true),
    ('Saumon Rôti', 'Pavé de saumon label rouge, purée de patate douce et asperges vertes.', 24.00, v_cat_plat_id, v_restaurant_id, 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&q=80', NULL, true),
    ('Risotto aux Champignons', 'Riz Carnaroli, mélange forestier, parmesan 24 mois et huile de truffe.', 19.50, v_cat_plat_id, v_restaurant_id, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80', NULL, true),
    ('Entrecôte Grillée (300g)', 'Servie avec frites maison et beurre maître d''hôtel.', 28.00, v_cat_plat_id, v_restaurant_id, 'https://images.unsplash.com/photo-1624726175512-19b9baf00ca9?auto=format&fit=crop&w=800&q=80', NULL, true);

    -- Desserts
    INSERT INTO items (name, description, price, category_id, restaurant_id, image_url, is_available) VALUES
    ('Tiramisu Della Nonna', 'La recette classique italienne au mascarpone et café ristretto.', 9.00, v_cat_dessert_id, v_restaurant_id, 'https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&q=80', true),
    ('Moelleux au Chocolat', 'Cœur coulant, glace vanille bourbon et crème anglaise.', 10.50, v_cat_dessert_id, v_restaurant_id, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?auto=format&fit=crop&q=80', true),
    ('Tarte Citron Meringuée', 'Pâte sablée croustillante, crémeux citron et meringue italienne.', 9.50, v_cat_dessert_id, v_restaurant_id, 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80', true);

    -- Boissons
    INSERT INTO items (name, description, price, category_id, restaurant_id, image_url, is_available) VALUES
    ('Mojito Passion', 'Rhum blanc, fruit de la passion frais, menthe, citron vert.', 12.00, v_cat_boisson_id, v_restaurant_id, 'https://images.unsplash.com/photo-1536935338788-843bb52b3646?auto=format&fit=crop&q=80', true),
    ('Coca-Cola (33cl)', 'Servi frais avec une tranche de citron.', 4.50, v_cat_boisson_id, v_restaurant_id, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80', true);

END $$;
