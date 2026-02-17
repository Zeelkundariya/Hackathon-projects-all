"""
Ultra-Simple Demand Uncertainty Analysis - Bulletproof Implementation
"""

import streamlit as st
import pandas as pd
import traceback

from backend.middleware.role_guard import require_authentication, require_role

def render_ultra_simple_uncertainty_analysis():
    """Render ultra-simple demand uncertainty analysis page."""
    
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
                st.info("📊 Loading data...")
                
                # Load data
                from simple_feasible_loader import load_simple_feasible_data
                base_data = load_simple_feasible_data("Dataset_Dummy_Clinker_3MPlan.xlsx", ['1'])
                st.success(f"✅ Data loaded: {len(base_data.plant_ids)} plants")
                
                # Initialize analyzer
                from demand_uncertainty_analysis import DemandUncertaintyAnalyzer
                analyzer = DemandUncertaintyAnalyzer(base_data)
                st.success("✅ Analyzer initialized")
                
                # Generate scenarios
                scenarios = analyzer.generate_demand_scenarios(num_scenarios, volatility)
                st.success(f"✅ Generated {len(scenarios)} scenarios")
                
                # Run deterministic optimization
                det_metrics = analyzer.run_deterministic_optimization()
                st.success(f"✅ Deterministic: ${det_metrics.total_cost:,.0f}")
                
                # Run stochastic optimization
                stoch_metrics = analyzer.run_stochastic_optimization()
                st.success(f"✅ Stochastic: ${stoch_metrics.total_cost:,.0f}")
                
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
                            'Multiplier': f"{s.get('demand_multiplier', 1.0):.2f}x"
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

print("✅ Ultra-simple demand uncertainty analysis UI created successfully")
