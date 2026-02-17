"""
MongoDB Data Manager - User Input Data Storage and Retrieval
"""

import streamlit as st
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
import traceback

class MongoDBDataManager:
    """Manages user input data storage and retrieval from MongoDB."""
    
    def __init__(self):
        """Initialize the MongoDB data manager."""
        self.collection_name = "user_input_data"
    
    def save_user_data(self, user_email: str, data: Dict[str, Any]) -> bool:
        """Save user input data to MongoDB."""
        try:
            # Mock MongoDB save - replace with actual MongoDB connection
            user_data = {
                "user_email": user_email,
                "timestamp": datetime.now().isoformat(),
                "data": data,
                "status": "active"
            }
            
            # Store in session state for now (replace with actual MongoDB)
            if 'mongodb_data' not in st.session_state:
                st.session_state.mongodb_data = {}
            
            st.session_state.mongodb_data[user_email] = user_data
            
            st.success(f"✅ Data saved successfully for {user_email}")
            return True
            
        except Exception as e:
            st.error(f"❌ Failed to save data: {str(e)}")
            return False
    
    def get_user_data(self, user_email: str) -> Optional[Dict[str, Any]]:
        """Get user input data from MongoDB."""
        try:
            # Mock MongoDB get - replace with actual MongoDB connection
            if 'mongodb_data' in st.session_state and user_email in st.session_state.mongodb_data:
                return st.session_state.mongodb_data[user_email]["data"]
            return None
            
        except Exception as e:
            st.error(f"❌ Failed to retrieve data: {str(e)}")
            return None
    
    def has_user_data(self, user_email: str) -> bool:
        """Check if user has data in MongoDB."""
        return self.get_user_data(user_email) is not None
    
    def delete_user_data(self, user_email: str) -> bool:
        """Delete user data from MongoDB."""
        try:
            # Mock MongoDB delete - replace with actual MongoDB connection
            if 'mongodb_data' in st.session_state and user_email in st.session_state.mongodb_data:
                del st.session_state.mongodb_data[user_email]
                st.success(f"✅ Data deleted successfully for {user_email}")
                return True
            return False
            
        except Exception as e:
            st.error(f"❌ Failed to delete data: {str(e)}")
            return False

def render_data_input_page():
    """Render the data input page for users."""
    
    st.title("📊 Data Input")
    st.markdown("Input your supply chain data for analysis and optimization.")
    
    user_email = st.session_state.get("user_email", "")
    
    if not user_email:
        st.error("Please login first")
        return
    
    data_manager = MongoDBDataManager()
    
    # Check if user already has data
    if data_manager.has_user_data(user_email):
        st.info("📊 You already have data saved. You can update it or use existing data.")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Update Existing Data", type="primary"):
                st.session_state.show_data_input = True
        with col2:
            if st.button("📋 Use Existing Data"):
                st.session_state.show_data_input = False
                st.success("✅ Using existing data for analysis")
    
    # Show data input form
    if st.session_state.get("show_data_input", True):
        st.markdown("---")
        st.markdown("### 📝 Input Your Data")
        
        # Plant Data
        st.markdown("#### 🏭 Plant Data")
        with st.expander("Plant Information", expanded=True):
            num_plants = st.number_input("Number of Plants", min_value=1, max_value=10, value=3, key="num_plants_input")
            
            plant_data = []
            for i in range(num_plants):
                st.markdown(f"**Plant {i+1}**")
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    plant_name = st.text_input(f"Plant Name {i+1}", value=f"Plant_{i+1}", key=f"plant_name_{i}_data_input")
                with col2:
                    capacity = st.number_input(f"Capacity {i+1}", min_value=0, value=1000, key=f"capacity_{i}_data_input")
                with col3:
                    production_cost = st.number_input(f"Production Cost {i+1}", min_value=0, value=50, key=f"prod_cost_{i}_data_input")
                with col4:
                    location = st.text_input(f"Location {i+1}", value=f"Location_{i+1}", key=f"location_{i}_data_input")
                
                plant_data.append({
                    "plant_name": plant_name,
                    "capacity": capacity,
                    "production_cost": production_cost,
                    "location": location
                })
        
        # Demand Data
        st.markdown("#### 📦 Demand Data")
        with st.expander("Demand Information", expanded=True):
            num_demands = st.number_input("Number of Demand Points", min_value=1, max_value=10, value=3, key="num_demands_input")
            
            demand_data = []
            for i in range(num_demands):
                st.markdown(f"**Demand Point {i+1}**")
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    demand_name = st.text_input(f"Demand Name {i+1}", value=f"Demand_{i+1}", key=f"demand_name_{i}_data_input")
                with col2:
                    demand_quantity = st.number_input(f"Demand Quantity {i+1}", min_value=0, value=500, key=f"demand_qty_{i}_data_input")
                with col3:
                    demand_location = st.text_input(f"Demand Location {i+1}", value=f"Location_{i+1}", key=f"demand_loc_{i}_data_input")
                
                demand_data.append({
                    "demand_name": demand_name,
                    "demand_quantity": demand_quantity,
                    "demand_location": demand_location
                })
        
        # Transport Cost Data
        st.markdown("#### 🚚 Transport Cost Data")
        with st.expander("Transport Costs", expanded=True):
            transport_data = []
            
            for i, plant in enumerate(plant_data):
                for j, demand in enumerate(demand_data):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.markdown(f"**{plant['plant_name']} → {demand['demand_name']}**")
                    with col2:
                        cost = st.number_input(
                            f"Transport Cost", 
                            min_value=0, 
                            value=10, 
                            key=f"transport_{i}_{j}_data_input"
                        )
                    
                    transport_data.append({
                        "from_plant": plant['plant_name'],
                        "to_demand": demand['demand_name'],
                        "transport_cost": cost
                    })
        
        # Time Periods
        st.markdown("#### 📅 Time Periods")
        with st.expander("Planning Periods", expanded=True):
            num_periods = st.number_input("Number of Planning Periods", min_value=1, max_value=12, value=3, key="num_periods_input")
            
            period_data = []
            for i in range(num_periods):
                period_name = st.text_input(f"Period {i+1} Name", value=f"Period_{i+1}", key=f"period_{i}_data_input")
                period_data.append({
                    "period_name": period_name,
                    "period_id": str(i+1)
                })
        
        # Save Button
        st.markdown("---")
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("💾 Save Data to MongoDB", type="primary", use_container_width=True):
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
                
                if data_manager.save_user_data(user_email, user_data):
                    st.success("✅ Data saved successfully!")
                    st.session_state.show_data_input = False
                    st.rerun()
        
        with col2:
            if st.button("🔄 Reset Form", use_container_width=True):
                st.session_state.show_data_input = True
                st.rerun()
    
    # Display existing data
    else:
        existing_data = data_manager.get_user_data(user_email)
        if existing_data:
            st.markdown("---")
            st.markdown("### 📋 Your Saved Data")
            
            # Display summary
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Plants", existing_data["metadata"]["num_plants"])
            with col2:
                st.metric("Demand Points", existing_data["metadata"]["num_demands"])
            with col3:
                st.metric("Periods", existing_data["metadata"]["num_periods"])
            
            # Display data tables
            st.markdown("#### 🏭 Plants")
            plants_df = pd.DataFrame(existing_data["plants"])
            st.dataframe(plants_df, use_container_width=True)
            
            st.markdown("#### 📦 Demand Points")
            demands_df = pd.DataFrame(existing_data["demands"])
            st.dataframe(demands_df, use_container_width=True)
            
            st.markdown("#### 🚚 Transport Costs")
            transport_df = pd.DataFrame(existing_data["transport_costs"])
            st.dataframe(transport_df, use_container_width=True)
            
            # Action buttons
            st.markdown("---")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("🔄 Update Data", type="primary"):
                    st.session_state.show_data_input = True
                    st.rerun()
            
            with col2:
                if st.button("📊 Run Analysis"):
                    st.switch_page("Demand Uncertainty Analysis")
            
            with col3:
                if st.button("🚀 Run Optimization"):
                    st.switch_page("Run Optimization")

print("✅ MongoDB Data Manager created successfully")
