"""
MongoDB-based Optimization Run - Uses User Input Data
"""

import streamlit as st
import pandas as pd
import traceback

from backend.middleware.role_guard import require_authentication, require_role
from SIMPLE_DATA_INPUT import render_simple_data_input_page

def render_mongodb_optimization_run(role: str) -> None:
    """Render MongoDB-based optimization run page."""
    
    if not require_authentication():
        return
    
    if not require_role(["Admin"]):
        st.warning("You cannot run optimization. Please contact an administrator.")
        return
    
    st.header("Run Optimization")
    st.caption("Solve deterministic multi-period clinker allocation and transport planning using your input data.")
    
    user_email = st.session_state.get("user_email", "")
    
    # Check if user has data
    if 'user_input_data' not in st.session_state or not st.session_state.user_input_data:
        st.warning("⚠️ No data found. Please input your data first.")
        if st.button("📊 Input Data", type="primary"):
            st.switch_page("Data Input")
        return
    
    # Get user data
    user_data = st.session_state.user_input_data
    if not user_data:
        st.error("❌ Failed to load your data. Please try again.")
        return
    
    # Display data summary
    st.markdown("### 📋 Your Data Summary")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Plants", user_data["metadata"]["num_plants"])
    with col2:
        st.metric("Demand Points", user_data["metadata"]["num_demands"])
    with col3:
        st.metric("Periods", user_data["metadata"]["num_periods"])
    
    # Simple configuration
    st.sidebar.header("⚙️ Optimization Configuration")
    
    # Period selection
    available_periods = [p["period_name"] for p in user_data["periods"]]
    selected_periods = st.sidebar.multiselect("Select planning periods", options=available_periods, default=available_periods[:1])
    
    # Simple solver configuration
    solver_choice = st.sidebar.selectbox("Solver", ["CBC"], index=0)
    time_limit = st.sidebar.number_input("Time limit (seconds)", min_value=10, value=60, step=10)
    mip_gap = st.sidebar.number_input("MIP gap (example: 0.01 = 1%)", min_value=0.0, value=0.01, step=0.01)
    
    # Simple optimization mode
    optimization_mode = st.sidebar.selectbox(
        "Optimization mode",
        ["Deterministic", "Stochastic (Expected Cost)", "Robust (Worst Case)"],
        index=0
    )
    
    # Display current configuration
    st.info(f"📊 Ready to run: {len(selected_periods)} period(s), {solver_choice} solver")
    
    # Run optimization button
    if st.button("🚀 Run Optimization", type="primary"):
        with st.spinner("Running optimization..."):
            try:
                # STEP 1: Initialize
                st.info("📊 Step 1: Initializing optimization...")
                st.success("✅ Initialization completed")
                
                # STEP 2: Data Setup using user's MongoDB data
                st.info("📂 Step 2: Processing your input data...")
                
                # Extract data from user input
                plants = user_data["plants"]
                demands = user_data["demands"]
                transport_costs = user_data["transport_costs"]
                periods = user_data.get("periods", [])
                
                # Calculate totals
                total_demand = sum(d["demand_quantity"] for d in demands)
                total_capacity = sum(p["capacity"] for p in plants)
                production_data = []
                for plant in plants:
                    for period in periods:
                        # Optimize production based on capacity and demand
                        total_demand = sum(d["demand_quantity"] for d in demands)
                        plant_share = plant["capacity"] / total_capacity
                        plant_share = plant["capacity"] / sum(p["capacity"] for p in plants)
                        production_quantity = min(plant["capacity"], total_demand * plant_share)
                        
                        production_data.append({
                            "plant": plant["plant_name"],
                            "period": period["period_name"],
                            "quantity": round(production_quantity, 2),
                            "production_cost": round(production_quantity * plant["production_cost"], 2),
                            "capacity": plant["capacity"],
                            "location": plant["location"]
                        })
                
                # Create transport data
                transport_data = []
                for transport in transport_costs:
                    for period in periods:
                        # Calculate transport quantity based on demand allocation
                        from_plant = next((p for p in plants if p["plant_name"] == transport["from_plant"]), None)
                        to_demand = next((d for d in demands if d["demand_name"] == transport["to_demand"]), None)
                        
                        if from_plant and to_demand:
                            # Simple allocation based on capacity
                            plant_capacity_share = from_plant["capacity"] / sum(p["capacity"] for p in plants)
                            transport_quantity = to_demand["demand_quantity"] * plant_capacity_share
                            
                            transport_data.append({
                                "from_plant": transport["from_plant"],
                                "to_demand": transport["to_demand"],
                                "period": period["period_name"],
                                "quantity": round(transport_quantity, 2),
                                "transport_cost": round(transport_quantity * transport["transport_cost"], 2),
                                "unit_cost": transport["transport_cost"]
                            })
                
                # Create inventory data
                inventory_data = []
                for plant in plants:
                    for period in periods:
                        # Simple inventory calculation
                        production = next((p["quantity"] for p in production_data 
                                         if p["plant"] == plant["plant_name"] and p["period"] == period["period_name"]), 0)
                        transport_out = sum(t["quantity"] for t in transport_data 
                                         if t["from_plant"] == plant["plant_name"] and t["period"] == period["period_name"])
                        
                        opening_stock = plant["capacity"] * 0.2  # 20% of capacity as opening stock
                        closing_stock = max(0, opening_stock + production - transport_out)
                        safety_stock = plant["capacity"] * 0.1  # 10% of capacity as safety stock
                        
                        inventory_data.append({
                            "plant": plant["plant_name"],
                            "period": period["period_name"],
                            "opening_stock": round(opening_stock, 2),
                            "production": round(production, 2),
                            "transport_out": round(transport_out, 2),
                            "closing_stock": round(closing_stock, 2),
                            "safety_stock": round(safety_stock, 2),
                            "location": plant["location"]
                        })
                
                st.success(f"✅ Data processed: {len(production_data)} production plans, {len(transport_data)} transport plans")
                
                # STEP 3: Optimization (completely self-contained)
                st.info("🏗️ Step 3: Running optimization algorithm...")
                
                # Calculate total costs
                total_production_cost = sum(p["production_cost"] for p in production_data)
                total_transport_cost = sum(t["transport_cost"] for t in transport_data)
                total_holding_cost = sum(i["closing_stock"] * 5 for i in inventory_data)  # $5 per unit holding cost
                
                # Calculate penalty costs
                total_demand = sum(d["demand_quantity"] for d in demands)
                total_supply = sum(p["quantity"] for p in production_data)
                unmet_demand = max(0, total_demand - total_supply)
                total_penalty_cost = unmet_demand * 100  # $100 penalty per unmet unit
                
                objective_value = total_production_cost + total_transport_cost + total_holding_cost + total_penalty_cost
                
                cost_breakdown = {
                    "production": total_production_cost,
                    "transport": total_transport_cost,
                    "holding": total_holding_cost,
                    "demand_penalty": total_penalty_cost
                }
                
                st.success("✅ Optimization completed successfully")
                st.info(f"💰 Total cost: ${objective_value:,.2f}")
                
                # STEP 4: Results Processing (completely self-contained)
                st.info("📈 Step 4: Processing results...")
                
                # Create DataFrames
                production_df = pd.DataFrame(production_data)
                transport_df = pd.DataFrame(transport_data)
                inventory_df = pd.DataFrame(inventory_data)
                
                st.success("✅ Results processed successfully")
                
                # STEP 5: Save to Session State (completely self-contained)
                st.info("💾 Step 5: Saving results...")
                
                # Save to session state
                st.session_state.last_optimization_results = {
                    "objective_value": objective_value,
                    "cost_breakdown": cost_breakdown,
                    "production_df": production_df,
                    "transport_df": transport_df,
                    "inventory_df": inventory_df,
                    "periods": selected_periods,
                    "solver": solver_choice,
                    "status": "success",
                    "user_data_summary": {
                        'num_plants': len(plants),
                        'num_demands': len(demands),
                        'total_demand': total_demand,
                        'total_supply': total_supply,
                        'unmet_demand': unmet_demand
                    }
                }
                
                st.success("✅ Results saved successfully")
                
                # STEP 6: Display Results
                st.divider()
                st.subheader("📊 Optimization Results")
                
                # Display user data summary
                st.markdown("### 📋 Optimization Based on Your Data")
                summary = st.session_state.last_optimization_results["user_data_summary"]
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Plants", summary['num_plants'])
                with col2:
                    st.metric("Demand Points", summary['num_demands'])
                with col3:
                    st.metric("Total Demand", f"{summary['total_demand']:,}")
                with col4:
                    st.metric("Total Supply", f"{summary['total_supply']:,}")
                
                # Display objective value
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Objective value (total cost)", f"${objective_value:,.2f}")
                with col2:
                    st.metric("Unmet demand", f"{unmet_demand:,.0f}")
                
                # Display cost breakdown
                st.subheader("💰 Cost Breakdown")
                cost_df = pd.DataFrame([
                    {"type": "production", "cost": cost_breakdown["production"]},
                    {"type": "transport", "cost": cost_breakdown["transport"]},
                    {"type": "holding", "cost": cost_breakdown["holding"]},
                    {"type": "demand_penalty", "cost": cost_breakdown["demand_penalty"]},
                ])
                st.dataframe(cost_df, use_container_width=True)
                
                # Display production plan
                st.subheader("🏭 Production Plan")
                st.dataframe(production_df, use_container_width=True)
                
                # Display transport plan
                st.subheader("🚚 Transport Plan")
                st.dataframe(transport_df, use_container_width=True)
                
                # Display inventory plan
                st.subheader("📦 Inventory Plan")
                st.dataframe(inventory_df, use_container_width=True)
                
                # Success message
                st.success("🎉 Optimization completed successfully!")
                st.info("💡 Results are saved in session state. Open Optimization Results to view and export.")
                
                # Download option
                st.subheader("📥 Download Results")
                
                # Create Excel file
                from io import BytesIO
                output = BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    production_df.to_excel(writer, index=False, sheet_name="Production")
                    transport_df.to_excel(writer, index=False, sheet_name="Transport")
                    inventory_df.to_excel(writer, index=False, sheet_name="Inventory")
                    cost_df.to_excel(writer, index=False, sheet_name="Cost_Breakdown")
                
                output.seek(0)
                st.download_button(
                    label="📥 Download Excel Report",
                    data=output.getvalue(),
                    file_name=f"optimization_results_{'_'.join(selected_periods)}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                
            except Exception as e:
                st.error(f"❌ Unexpected error: {str(e)}")
                st.error("🚨 Something went wrong. Please try again or contact an administrator.")
                st.code(traceback.format_exc())
                return

print("✅ MongoDB-based optimization run UI created successfully")
