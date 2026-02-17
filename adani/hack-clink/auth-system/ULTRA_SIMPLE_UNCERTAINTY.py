"""
Ultra-Simple Demand Uncertainty Analysis - Bulletproof Implementation
"""

import streamlit as st
import pandas as pd
import random
import traceback

from backend.middleware.role_guard import require_authentication, require_role

def render_ultra_simple_uncertainty_analysis():
    """Render ultra-simple demand uncertainty analysis page."""
    
    if not require_authentication():
        return
    
    if not require_role(["Admin"]):
        return
    
    st.title("🎲 Demand Uncertainty Analysis")
    st.markdown("Compare how cost and customer service performance change when demand is unpredictable versus when demand is known in advance using your input data.")
    
    user_email = st.session_state.get("user_email", "")
    
    # Check if user has data
    st.write("Debug: Session state keys:", list(st.session_state.keys()))
    st.write("Debug: user_input_data in session:", "user_input_data" in st.session_state)
    st.write("Debug: user_input_data value:", st.session_state.get("user_input_data", "NOT_FOUND"))
    st.write("Debug: Type of user_input_data:", type(st.session_state.get("user_input_data", "NOT_FOUND")))
    
    # Try multiple ways to access the data
    user_data = None
    if "user_input_data" in st.session_state:
        user_data = st.session_state.user_input_data
        st.write("Debug: Successfully accessed user_input_data directly")
    elif hasattr(st.session_state, 'user_input_data'):
        user_data = getattr(st.session_state, 'user_input_data')
        st.write("Debug: Accessed user_input_data via getattr")
    
    if not user_data:
        st.warning("⚠️ No data found. Please input your data first.")
        if st.button("📊 Input Data", type="primary"):
            st.switch_page("Data Input")
        return
    
    # Additional validation
    if not isinstance(user_data, dict):
        st.error("❌ Invalid data format. Please re-input your data.")
        st.write("Debug: user_data is not a dictionary:", type(user_data))
        if st.button("📊 Input Data", type="primary"):
            st.switch_page("Data Input")
        return
    
    if not user_data.get("plants") or not user_data.get("demands"):
        st.error("❌ Incomplete data. Please re-input your data with plants and demands.")
        st.write("Debug: Missing plants or demands in user_data")
        if st.button("📊 Input Data", type="primary"):
            st.switch_page("Data Input")
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
    st.sidebar.header("⚙️ Analysis Configuration")
    
    num_scenarios = st.sidebar.slider("Number of Scenarios", 3, 10, 5)
    volatility = st.sidebar.slider("Demand Volatility", 0.1, 0.5, 0.3)
    
    # Display current configuration
    st.info(f"📊 Ready to run: {num_scenarios} scenarios, {volatility:.1%} volatility")
    
    # Run analysis button
    st.markdown("---")
    st.markdown("### 🚀 Run Analysis")
    run_analysis = st.button("🚀 Run Analysis", type="primary", use_container_width=True)
    
    # Analysis results storage
    if "uncertainty_analysis_results" not in st.session_state:
        st.session_state.uncertainty_analysis_results = None
    
    # Run analysis
    if run_analysis:
        try:
            with st.spinner("🔄 Running analysis..."):
                st.info("📊 Step 1: Processing your input data...")
                
                # Extract data from user input
                plants = user_data["plants"]
                demands = user_data["demands"]
                transport_costs = user_data["transport_costs"]
                periods = user_data.get("periods", [])
                
                # Calculate base demand
                base_demand = sum(d["demand_quantity"] for d in demands)
                total_capacity = sum(p["capacity"] for p in plants)
                
                st.success(f"✅ Data processed: {len(plants)} plants, {len(demands)} demands, total capacity: {total_capacity:,}")
                
                st.info("🎲 Step 2: Generating demand scenarios...")
                
                # Generate scenarios using user's demand data
                scenarios = []
                for i in range(num_scenarios):
                    # Create demand multiplier using pure Python
                    demand_multiplier = 1.0
                    for _ in range(10):  # Simple approximation of normal distribution
                        demand_multiplier += random.uniform(-volatility, volatility)
                    demand_multiplier = max(0.1, min(3.0, demand_multiplier / 10))  # Normalize and clamp
                    
                    # Apply multiplier to each demand point
                    adjusted_demands = []
                    for demand in demands:
                        adjusted_quantity = round(demand["demand_quantity"] * demand_multiplier, 0)
                        adjusted_demands.append({
                            "demand_name": demand["demand_name"],
                            "original_quantity": demand["demand_quantity"],
                            "adjusted_quantity": adjusted_quantity,
                            "demand_location": demand["demand_location"]
                        })
                    
                    scenarios.append({
                        "name": f"Scenario_{i+1}",
                        "probability": 1.0 / num_scenarios,
                        "demand_multiplier": round(demand_multiplier, 2),
                        "total_demand": sum(d["adjusted_quantity"] for d in adjusted_demands),
                        "demands": adjusted_demands
                    })
                
                st.success(f"✅ Generated {len(scenarios)} scenarios")
                
                st.info("🏗️ Step 3: Running deterministic analysis...")
                
                # Simple deterministic analysis
                total_production_cost = 0
                total_transport_cost = 0
                total_holding_cost = 0
                
                # Calculate production costs
                for plant in plants:
                    production_quantity = min(plant["capacity"], base_demand / len(plants))
                    production_cost = production_quantity * plant["production_cost"]
                    total_production_cost += production_cost
                
                # Calculate transport costs
                for transport in transport_costs:
                    avg_quantity = base_demand / len(transport_costs)
                    transport_cost = avg_quantity * transport["transport_cost"]
                    total_transport_cost += transport_cost
                
                # Holding cost
                total_holding_cost = total_capacity * 5  # $5 per unit capacity
                
                # No penalty in deterministic case
                det_penalty_cost = 0.0
                
                det_total_cost = total_production_cost + total_transport_cost + total_holding_cost + det_penalty_cost
                det_service_level = 0.95  # 95% service level
                det_unmet_demand = 0.0    # No unmet demand
                
                st.success(f"✅ Deterministic analysis: ${det_total_cost:,.0f}")
                
                st.info("🎲 Step 4: Running stochastic analysis...")
                
                # Simple stochastic analysis
                stoch_production_cost = 0
                stoch_transport_cost = 0
                stoch_holding_cost = 0
                stoch_penalty_cost = 0
                total_expected_demand = 0
                
                for scenario in scenarios:
                    scenario_prob = scenario["probability"]
                    scenario_demand = scenario["total_demand"]
                    total_expected_demand += scenario_demand * scenario_prob
                    
                    # Production cost for this scenario
                    scenario_production_cost = 0
                    for plant in plants:
                        plant_allocation = min(plant["capacity"], scenario_demand * (plant["capacity"] / total_capacity))
                        production_cost = plant_allocation * plant["production_cost"]
                        scenario_production_cost += production_cost
                    
                    # Transport cost for this scenario
                    scenario_transport_cost = 0
                    for transport in transport_costs:
                        avg_quantity = scenario_demand / len(transport_costs)
                        transport_cost = avg_quantity * transport["transport_cost"]
                        scenario_transport_cost += transport_cost
                    
                    # Penalty if demand exceeds capacity
                    if scenario_demand > total_capacity:
                        scenario_penalty_cost = (scenario_demand - total_capacity) * 100  # $100 penalty per unit
                    else:
                        scenario_penalty_cost = 0.0
                    
                    # Holding cost
                    scenario_holding_cost = total_capacity * 5
                    
                    # Weight by probability
                    stoch_production_cost += scenario_production_cost * scenario_prob
                    stoch_transport_cost += scenario_transport_cost * scenario_prob
                    stoch_holding_cost += scenario_holding_cost * scenario_prob
                    stoch_penalty_cost += scenario_penalty_cost * scenario_prob
                
                stoch_total_cost = stoch_production_cost + stoch_transport_cost + stoch_holding_cost + stoch_penalty_cost
                stoch_service_level = min(total_capacity / total_expected_demand, 0.95) if total_expected_demand > 0 else 0.95
                stoch_unmet_demand = max(0, total_expected_demand - total_capacity)
                
                st.success(f"✅ Stochastic analysis: ${stoch_total_cost:,.0f}")
                
                st.info("💾 Step 5: Storing results...")
                
                # Store results
                st.session_state.uncertainty_analysis_results = {
                    "deterministic": {
                        "total_cost": det_total_cost,
                        "service_level": det_service_level,
                        "unmet_demand": det_unmet_demand,
                        "demand_penalty": 0.0,
                        "production_cost": total_production_cost,
                        "transport_cost": total_transport_cost,
                        "holding_cost": total_holding_cost
                    },
                    "stochastic": {
                        "total_cost": stoch_total_cost,
                        "service_level": stoch_service_level,
                        "unmet_demand": stoch_unmet_demand,
                        "demand_penalty": stoch_penalty_cost,
                        "production_cost": stoch_production_cost,
                        "transport_cost": stoch_transport_cost,
                        "holding_cost": stoch_holding_cost
                    },
                    "scenarios": scenarios,
                    "user_data_summary": {
                        "num_plants": len(plants),
                        "num_demands": len(demands),
                        "total_capacity": total_capacity,
                        "base_demand": base_demand
                    }
                }
                
                st.success("🎉 Analysis completed successfully!")
                
        except Exception as e:
            st.error(f"❌ Analysis failed: {str(e)}")
            st.error("🚨 Please try again or contact an administrator.")
            st.text("Error details:")
            st.code(traceback.format_exc())
    
    # Display results
    if st.session_state.uncertainty_analysis_results:
        st.divider()
        st.subheader("📊 Analysis Results")
        
        results = st.session_state.uncertainty_analysis_results
        
        # User data summary
        st.markdown("### 📋 Analysis Based on Your Data")
        summary = results["user_data_summary"]
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Plants", summary["num_plants"])
        with col2:
            st.metric("Demand Points", summary["num_demands"])
        with col3:
            st.metric("Total Capacity", f"{summary['total_capacity']:,}")
        with col4:
            st.metric("Base Demand", f"{summary['base_demand']:,}")
        
        # Simple metrics display
        if "deterministic" in results and "stochastic" in results:
            det = results["deterministic"]
            stoch = results["stochastic"]
            
            # Executive summary
            st.subheader("🎯 Executive Summary")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                cost_diff = stoch["total_cost"] - det["total_cost"]
                cost_pct = (cost_diff / det["total_cost"]) * 100 if det["total_cost"] > 0 else 0
                st.metric("Cost Impact", f"{cost_pct:+.2f}%")
            
            with col2:
                service_diff = stoch["service_level"] - det["service_level"]
                st.metric("Service Change", f"{service_diff:+.2%}%")
            
            with col3:
                penalty_diff = stoch["demand_penalty"] - det["demand_penalty"]
                st.metric("Penalty Change", f"${penalty_diff:,.0f}")
            
            # Detailed comparison
            st.subheader("📈 Detailed Comparison")
            
            comparison_data = {
                "Metric": ["Total Cost", "Service Level", "Unmet Demand"],
                "Deterministic": [
                    f"${det['total_cost']:,.0f}",
                    f"{det['service_level']:.1%}",
                    f"{det['unmet_demand']:,.0f}"
                ],
                "Stochastic": [
                    f"${stoch['total_cost']:,.0f}",
                    f"{stoch['service_level']:.1%}",
                    f"{stoch['unmet_demand']:,.0f}"
                ]
            }
            
            df_comparison = pd.DataFrame(comparison_data)
            st.dataframe(df_comparison, use_container_width=True, hide_index=True)
            
            # Scenarios display
            if "scenarios" in results and results["scenarios"]:
                st.subheader("🎲 Generated Scenarios")
                
                try:
                    scenario_data = []
                    for s in results["scenarios"]:
                        scenario_data.append({
                            "Scenario": s.get("name", "Unknown"),
                            "Probability": f"{s.get('probability', 0):.2%}",
                            "Multiplier": f"{s.get('demand_multiplier', 1.0):.2f}x",
                            "Total Demand": f"{s.get('total_demand', 0):,.0f}"
                        })
                    
                    df_scenarios = pd.DataFrame(scenario_data)
                    st.dataframe(df_scenarios, use_container_width=True, hide_index=True)
                except Exception as e:
                    st.warning(f"⚠️ Scenario display issue: {str(e)}")
                    st.info("📊 Scenarios were generated but display had issues")
            
            # Action buttons
            st.subheader("🚀 Next Steps")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("🔄 Re-run Analysis", type="primary"):
                    st.rerun()
            
            with col2:
                if st.button("📊 Update Data"):
                    st.switch_page("Data Input")
            
            with col3:
                if st.button("🚀 Run Optimization"):
                    st.switch_page("Run Optimization")
    
    else:
        st.info("📊 No analysis results found. Please run analysis first.")
        if st.button("🚀 Run Analysis", type="primary"):
            st.rerun()

print("✅ Ultra-simple uncertainty analysis UI created successfully")
