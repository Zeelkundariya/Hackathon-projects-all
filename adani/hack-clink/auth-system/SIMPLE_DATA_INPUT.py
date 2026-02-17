"""
Simple Data Input - No Key Conflicts Guaranteed
"""

import streamlit as st
import pandas as pd
from datetime import datetime
import traceback

def render_simple_data_input_page():
    """Render simple data input page with no key conflicts."""
    
    st.title("📊 Data Input")
    st.markdown("Input your supply chain data for analysis and optimization.")
    
    user_email = st.session_state.get("user_email", "")
    
    if not user_email:
        st.error("Please login first")
        return
    
    # Simple data storage in session state
    if 'user_input_data' not in st.session_state:
        st.session_state.user_input_data = None
    
    # Check if user already has data
    if st.session_state.user_input_data:
        st.info("📊 You already have data saved.")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Update Data", type="primary", key="update_data_top"):
                st.session_state.user_input_data = None
                st.rerun()
        with col2:
            if st.button("📊 Use Existing Data"):
                st.success("✅ Using existing data for analysis")
    
    if not st.session_state.user_input_data:
        st.markdown("---")
        st.markdown("### 📝 Input Your Data")
        
        # Simple plant data input
        st.markdown("#### 🏭 Plant Data")
        num_plants = st.slider("Number of Plants", 1, 5, 3)
        
        plant_data = []
        for i in range(num_plants):
            with st.expander(f"Plant {i+1}", expanded=True):
                col1, col2 = st.columns(2)
                with col1:
                    plant_name = st.text_input(f"Plant Name", value=f"Plant_{i+1}", key=f"p_name_{i}")
                    capacity = st.number_input(f"Capacity", min_value=0, value=1000, key=f"p_cap_{i}")
                with col2:
                    production_cost = st.number_input(f"Production Cost", min_value=0, value=50, key=f"p_cost_{i}")
                    location = st.text_input(f"Location", value=f"Location_{i+1}", key=f"p_loc_{i}")
                
                plant_data.append({
                    "plant_name": plant_name,
                    "capacity": capacity,
                    "production_cost": production_cost,
                    "location": location
                })
        
        # Simple demand data input
        st.markdown("#### 📦 Demand Data")
        num_demands = st.slider("Number of Demand Points", 1, 5, 3)
        
        demand_data = []
        for i in range(num_demands):
            with st.expander(f"Demand Point {i+1}", expanded=True):
                col1, col2 = st.columns(2)
                with col1:
                    demand_name = st.text_input(f"Demand Name", value=f"Demand_{i+1}", key=f"d_name_{i}")
                    demand_quantity = st.number_input(f"Demand Quantity", min_value=0, value=500, key=f"d_qty_{i}")
                with col2:
                    demand_location = st.text_input(f"Demand Location", value=f"Location_{i+1}", key=f"d_loc_{i}")
                
                demand_data.append({
                    "demand_name": demand_name,
                    "demand_quantity": demand_quantity,
                    "demand_location": demand_location
                })
        
        # Simple transport cost input
        st.markdown("#### 🚚 Transport Costs")
        transport_data = []
        
        for i, plant in enumerate(plant_data):
            for j, demand in enumerate(demand_data):
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**{plant['plant_name']} → {demand['demand_name']}**")
                with col2:
                    transport_cost = st.number_input(f"Cost", min_value=0, value=10, key=f"trans_{i}_{j}")
                
                transport_data.append({
                    "from_plant": plant['plant_name'],
                    "to_demand": demand['demand_name'],
                    "transport_cost": transport_cost
                })
        
        # Simple period input
        st.markdown("#### 📅 Planning Periods")
        num_periods = st.slider("Number of Periods", 1, 6, 3)
        
        period_data = []
        for i in range(num_periods):
            period_name = st.text_input(f"Period {i+1} Name", value=f"Period_{i+1}", key=f"per_{i}")
            period_data.append({
                "period_name": period_name,
                "period_id": str(i+1)
            })
        
        # Save button
        st.markdown("---")
        if st.button("💾 Save Data", type="primary", use_container_width=True):
            try:
                user_data = {
                    "plants": plant_data,
                    "demands": demand_data,
                    "transport_costs": transport_data,
                    "periods": period_data,
                    "metadata": {
                        "num_plants": num_plants,
                        "num_demands": num_demands,
                        "num_periods": num_periods,
                        "created_at": datetime.now().isoformat()
                    }
                }
                
                # Save to session state
                st.session_state.user_input_data = user_data
                st.success("✅ Data saved successfully!")
                st.rerun()
                
            except Exception as e:
                st.error(f"❌ Failed to save data: {str(e)}")
                st.code(traceback.format_exc())
    
    else:
        # Display existing data
        st.markdown("---")
        st.markdown("### 📋 Your Saved Data")
        
        data = st.session_state.user_input_data
        
        # Summary
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Plants", data["metadata"]["num_plants"])
        with col2:
            st.metric("Demand Points", data["metadata"]["num_demands"])
        with col3:
            st.metric("Periods", data["metadata"]["num_periods"])
        
        # Plant data
        st.markdown("#### 🏭 Plants")
        plants_df = pd.DataFrame(data["plants"])
        st.dataframe(plants_df, use_container_width=True)
        
        # Demand data
        st.markdown("#### 📦 Demand Points")
        demands_df = pd.DataFrame(data["demands"])
        st.dataframe(demands_df, use_container_width=True)
        
        # Transport data
        st.markdown("#### 🚚 Transport Costs")
        transport_df = pd.DataFrame(data["transport_costs"])
        st.dataframe(transport_df, use_container_width=True)
        
        # Action buttons
        st.markdown("---")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔄 Update Data", type="primary", key="update_data_bottom"):
                st.session_state.user_input_data = None
                st.rerun()
        
        with col2:
            if st.button("📊 Run Analysis"):
                st.session_state.navigation = "Demand Uncertainty Analysis"
                st.rerun()
        
        with col3:
            if st.button("🚀 Run Optimization"):
                st.session_state.navigation = "Run Optimization"
                st.rerun()

print("✅ Simple data input page created successfully")
