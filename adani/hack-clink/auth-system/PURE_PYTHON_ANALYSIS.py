"""
Pure Python Demand Uncertainty Analysis - No External Dependencies At All
"""

import streamlit as st
import pandas as pd
import random
import traceback

from backend.middleware.role_guard import require_authentication, require_role

def render_pure_python_uncertainty_analysis():
    """Render pure python demand uncertainty analysis page - no external dependencies."""
    
    if not require_authentication():
        return
    
    if not require_role(["Admin", "Planner"]):
        return
    
    st.title("🎲 Demand Uncertainty Analysis")
    st.markdown("""
    Compare how cost and customer service performance change when demand is unpredictable 
    versus when demand is known in advance.
    """)
    
    # Simple configuration
    st.sidebar.header("⚙️ Configuration")
    
    num_scenarios = st.sidebar.slider("Number of Scenarios", 3, 10, 5)
    volatility = st.sidebar.slider("Demand Volatility", 0.1, 0.5, 0.3)
    
    # Display current configuration
    st.info(f"📊 Ready to run: {num_scenarios} scenarios, {volatility:.1%} volatility")
    
    # Run analysis button - make it more prominent
    st.markdown("---")
    st.markdown("### 🚀 Run Analysis")
    run_analysis = st.button("🚀 Run Analysis", type="primary", use_container_width=True)
    
    # Analysis results storage
    if 'analysis_results' not in st.session_state:
        st.session_state.analysis_results = None
    
    # Run analysis
    if run_analysis:
        try:
            with st.spinner("🔄 Running analysis..."):
                st.info("📊 Step 1: Setting up analysis parameters...")
                
                # Create mock data (completely self-contained)
                plants = ["Plant_A", "Plant_B", "Plant_C"]
                demands = ["Demand_1", "Demand_2", "Demand_3"]
                base_demand = 1000.0
                
                st.success("✅ Analysis parameters set")
                
                st.info("🎲 Step 2: Generating demand scenarios...")
                
                # Generate scenarios using pure Python (no numpy)
                scenarios = []
                for i in range(num_scenarios):
                    # Create demand multiplier using pure Python random
                    demand_multiplier = 1.0
                    for _ in range(10):  # Simple approximation of normal distribution
                        demand_multiplier += random.uniform(-volatility, volatility)
                    demand_multiplier = max(0.1, min(3.0, demand_multiplier / 10))  # Normalize and clamp
                    
                    scenarios.append({
                        'name': f'Scenario_{i+1}',
                        'probability': 1.0 / num_scenarios,
                        'demand_multiplier': round(demand_multiplier, 2),
                        'adjusted_demand': round(base_demand * demand_multiplier, 0)
                    })
                
                st.success(f"✅ Generated {len(scenarios)} scenarios")
                
                st.info("🏗️ Step 3: Running deterministic analysis...")
                
                # Deterministic analysis (pure Python)
                det_production_cost = base_demand * 50.0  # $50 per unit
                det_transport_cost = base_demand * 10.0   # $10 per unit
                det_holding_cost = 5000.0                # Fixed holding cost
                det_penalty_cost = 0.0                   # No penalty in deterministic
                
                det_total_cost = det_production_cost + det_transport_cost + det_holding_cost + det_penalty_cost
                det_service_level = 0.95                  # 95% service level
                det_unmet_demand = 0.0                    # No unmet demand
                
                class DeterministicMetrics:
                    def __init__(self):
                        self.total_cost = det_total_cost
                        self.service_level = det_service_level
                        self.unmet_demand = det_unmet_demand
                        self.demand_penalty = det_penalty_cost
                        self.production_cost = det_production_cost
                        self.transport_cost = det_transport_cost
                        self.holding_cost = det_holding_cost
                
                det_metrics = DeterministicMetrics()
                st.success(f"✅ Deterministic analysis: ${det_total_cost:,.0f}")
                
                st.info("🎲 Step 4: Running stochastic analysis...")
                
                # Stochastic analysis (pure Python)
                stoch_production_cost = 0.0
                stoch_transport_cost = 0.0
                stoch_holding_cost = 0.0
                stoch_penalty_cost = 0.0
                total_expected_demand = 0.0
                
                for scenario in scenarios:
                    scenario_demand = scenario['adjusted_demand']
                    scenario_prob = scenario['probability']
                    
                    # Calculate costs for this scenario
                    scenario_production_cost = scenario_demand * 50.0
                    scenario_transport_cost = scenario_demand * 10.0
                    scenario_holding_cost = 5000.0
                    
                    # Add penalty if demand exceeds capacity (assume capacity = 1200)
                    if scenario_demand > 1200:
                        scenario_penalty_cost = (scenario_demand - 1200) * 100.0  # $100 penalty per unit over capacity
                    else:
                        scenario_penalty_cost = 0.0
                    
                    # Weight by probability
                    stoch_production_cost += scenario_production_cost * scenario_prob
                    stoch_transport_cost += scenario_transport_cost * scenario_prob
                    stoch_holding_cost += scenario_holding_cost * scenario_prob
                    stoch_penalty_cost += scenario_penalty_cost * scenario_prob
                    total_expected_demand += scenario_demand * scenario_prob
                
                stoch_total_cost = stoch_production_cost + stoch_transport_cost + stoch_holding_cost + stoch_penalty_cost
                stoch_service_level = 0.92  # Slightly lower due to uncertainty
                stoch_unmet_demand = max(0, total_expected_demand - 1200)  # Unmet demand if exceeds capacity
                
                class StochasticMetrics:
                    def __init__(self):
                        self.total_cost = stoch_total_cost
                        self.service_level = stoch_service_level
                        self.unmet_demand = stoch_unmet_demand
                        self.demand_penalty = stoch_penalty_cost
                        self.production_cost = stoch_production_cost
                        self.transport_cost = stoch_transport_cost
                        self.holding_cost = stoch_holding_cost
                
                stoch_metrics = StochasticMetrics()
                st.success(f"✅ Stochastic analysis: ${stoch_total_cost:,.0f}")
                
                st.info("💾 Step 5: Storing results...")
                
                # Store results
                st.session_state.analysis_results = {
                    'deterministic': det_metrics,
                    'stochastic': stoch_metrics,
                    'scenarios': scenarios
                }
                
                st.success("🎉 Analysis completed successfully!")
                
        except Exception as e:
            st.error(f"❌ Analysis failed: {str(e)}")
            st.error("🚨 Please try again or contact an administrator.")
            st.text("Error details:")
            st.code(traceback.format_exc())
    
    # Display results
    if st.session_state.analysis_results:
        st.divider()
        st.subheader("📊 Analysis Results")
        
        results = st.session_state.analysis_results
        
        # Simple metrics display
        if 'deterministic' in results and 'stochastic' in results:
            det = results['deterministic']
            stoch = results['stochastic']
            
            # Executive summary
            st.subheader("🎯 Executive Summary")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                cost_diff = stoch.total_cost - det.total_cost
                cost_pct = (cost_diff / det.total_cost) * 100 if det.total_cost > 0 else 0
                st.metric("Cost Impact", f"{cost_pct:+.2f}%")
            
            with col2:
                service_diff = stoch.service_level - det.service_level
                st.metric("Service Change", f"{service_diff:+.2%}%")
            
            with col3:
                penalty_diff = stoch.demand_penalty - det.demand_penalty
                st.metric("Penalty Change", f"${penalty_diff:,.0f}")
            
            # Detailed comparison
            st.subheader("📈 Detailed Comparison")
            
            # Simple comparison table
            comparison_data = {
                'Metric': ['Total Cost', 'Service Level', 'Unmet Demand'],
                'Deterministic': [
                    f"${det.total_cost:,.0f}",
                    f"{det.service_level:.1%}",
                    f"{det.unmet_demand:,.0f}"
                ],
                'Stochastic': [
                    f"${stoch.total_cost:,.0f}",
                    f"{stoch.service_level:.1%}",
                    f"{stoch.unmet_demand:,.0f}"
                ]
            }
            
            df_comparison = pd.DataFrame(comparison_data)
            st.dataframe(df_comparison, use_container_width=True, hide_index=True)
            
            # Scenarios display
            if 'scenarios' in results and results['scenarios']:
                st.subheader("🎲 Generated Scenarios")
                
                try:
                    scenario_data = []
                    for s in results['scenarios']:
                        scenario_data.append({
                            'Scenario': s.get('name', 'Unknown'),
                            'Probability': f"{s.get('probability', 0):.2%}",
                            'Multiplier': f"{s.get('demand_multiplier', 1.0):.2f}x",
                            'Adjusted Demand': f"{s.get('adjusted_demand', 0):,.0f}"
                        })
                    
                    df_scenarios = pd.DataFrame(scenario_data)
                    st.dataframe(df_scenarios, use_container_width=True, hide_index=True)
                except Exception as e:
                    st.warning(f"⚠️ Scenario display issue: {str(e)}")
                    st.info("📊 Scenarios were generated but display had issues")
            else:
                st.info("📊 No scenarios data available")
            
            # Action buttons
            st.subheader("🚀 Next Steps")
            
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("🔄 Re-run Analysis", type="primary"):
                    st.rerun()
            
            with col2:
                if st.button("⚙️ Settings"):
                    st.switch_page("Demand Uncertainty Settings")
    
    else:
        st.info("📊 No analysis results found. Please run analysis first.")
        if st.button("🚀 Run Analysis", type="primary"):
            st.rerun()

print("✅ Pure python demand uncertainty analysis UI created successfully")
