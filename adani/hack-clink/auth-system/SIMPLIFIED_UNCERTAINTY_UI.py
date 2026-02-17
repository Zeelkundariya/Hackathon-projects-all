"""
Simplified Demand Uncertainty Analysis UI - Robust and Error-Free
"""

import streamlit as st
import pandas as pd
import traceback
from typing import Dict, Any

from backend.middleware.role_guard import require_authentication, require_role

def render_simplified_uncertainty_analysis():
    """Render simplified demand uncertainty analysis page."""
    
    if not require_authentication():
        return
    
    if not require_role(["Admin", "Planner"]):
        return
    
    st.title("🎲 Demand Uncertainty Analysis")
    st.markdown("""
    Compare how cost and customer service performance change when demand is unpredictable 
    versus when demand is known in advance.
    """)
    
    # Initialize session state
    if 'analysis_results' not in st.session_state:
        st.session_state.analysis_results = None
    
    # Simple configuration
    st.sidebar.header("⚙️ Configuration")
    
    num_scenarios = st.sidebar.slider("Number of Scenarios", 3, 10, 5)
    volatility = st.sidebar.slider("Demand Volatility", 0.1, 0.5, 0.3)
    run_deterministic = st.sidebar.checkbox("Run Deterministic", True)
    run_stochastic = st.sidebar.checkbox("Run Stochastic", True)
    generate_plots = st.sidebar.checkbox("Generate Plots", False)
    
    # Run analysis button
    if st.sidebar.button("🚀 Run Analysis", type="primary"):
        try:
            with st.spinner("🔄 Running analysis..."):
                st.info(f"📊 Configuration: {num_scenarios} scenarios, {volatility:.1%} volatility")
                
                # Load data
                from simple_feasible_loader import load_simple_feasible_data
                base_data = load_simple_feasible_data("Dataset_Dummy_Clinker_3MPlan.xlsx", ['1'])
                st.success(f"✅ Data loaded: {len(base_data.plant_ids)} plants, {len(base_data.routes)} routes")
                
                # Initialize analyzer
                from demand_uncertainty_analysis import DemandUncertaintyAnalyzer
                analyzer = DemandUncertaintyAnalyzer(base_data)
                
                # Generate scenarios
                scenarios = analyzer.generate_demand_scenarios(num_scenarios, volatility)
                st.success(f"✅ Generated {len(scenarios)} scenarios")
                
                # Run optimizations
                results = {}
                
                if run_deterministic:
                    with st.spinner("🔧 Running deterministic optimization..."):
                        det_metrics = analyzer.run_deterministic_optimization()
                        results['deterministic'] = det_metrics
                        st.success(f"✅ Deterministic: ${det_metrics.total_cost:,.0f}, Service: {det_metrics.service_level:.1%}")
                
                if run_stochastic:
                    with st.spinner("🎲 Running stochastic optimization..."):
                        stoch_metrics = analyzer.run_stochastic_optimization()
                        results['stochastic'] = stoch_metrics
                        st.success(f"✅ Stochastic: ${stoch_metrics.total_cost:,.0f}, Service: {stoch_metrics.service_level:.1%}")
                
                # Get comparison
                if run_deterministic and run_stochastic:
                    with st.spinner("📊 Comparing performance..."):
                        comparison = analyzer.compare_performance()
                        results['comparison'] = comparison
                        results['scenarios'] = scenarios
                        st.success("✅ Performance comparison completed")
                
                # Generate plots (optional)
                if generate_plots and run_deterministic and run_stochastic:
                    try:
                        with st.spinner("📈 Generating plots..."):
                            plots = analyzer.create_comparison_plots()
                            results['plots'] = plots
                            st.success("✅ Plots generated")
                    except Exception as plot_error:
                        st.warning(f"⚠️ Plot generation failed: {str(plot_error)}")
                        results['plots'] = {}
                
                # Generate report
                try:
                    with st.spinner("📄 Generating report..."):
                        report = analyzer.generate_report()
                        results['report'] = report
                        st.success("✅ Report generated")
                except Exception as report_error:
                    st.warning(f"⚠️ Report generation failed: {str(report_error)}")
                    results['report'] = "Report generation failed"
                
                # Store results
                st.session_state.analysis_results = results
                st.success("🎉 Analysis completed successfully!")
                
        except Exception as e:
            st.error(f"❌ Analysis failed: {str(e)}")
            st.error("🚨 Please try again or contact an administrator.")
            st.exception(traceback.format_exc())
    
    # Display results
    if st.session_state.analysis_results:
        st.divider()
        st.subheader("📊 Analysis Results")
        
        results = st.session_state.analysis_results
        
        # Executive Summary
        st.subheader("🎯 Executive Summary")
        
        if 'comparison' in results and 'differences' in results['comparison']:
            diffs = results['comparison']['differences']
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Cost Impact",
                    f"{diffs.get('total_cost_pct', 0):+.2f}%",
                    help="Percentage change in total cost"
                )
            
            with col2:
                st.metric(
                    "Service Level Change",
                    f"{diffs.get('service_level_diff', 0):+.2%}",
                    help="Change in service level"
                )
            
            with col3:
                st.metric(
                    "Total Cost Difference",
                    f"${diffs.get('total_cost_diff', 0):,.0f}",
                    help="Absolute difference in total cost"
                )
        
        # Detailed Results
        if 'deterministic' in results and 'stochastic' in results:
            st.subheader("📈 Detailed Comparison")
            
            det = results['deterministic']
            stoch = results['stochastic']
            
            # Cost comparison table
            st.write("**Cost Comparison:**")
            cost_data = {
                'Component': ['Total Cost', 'Production', 'Transport', 'Holding', 'Penalty'],
                'Deterministic': [
                    f"${det.get('total_cost', 0):,.0f}",
                    f"${det.get('production_cost', 0):,.0f}",
                    f"${det.get('transport_cost', 0):,.0f}",
                    f"${det.get('holding_cost', 0):,.0f}",
                    f"${det.get('demand_penalty', 0):,.0f}"
                ],
                'Stochastic': [
                    f"${stoch.get('total_cost', 0):,.0f}",
                    f"${stoch.get('production_cost', 0):,.0f}",
                    f"${stoch.get('transport_cost', 0):,.0f}",
                    f"${stoch.get('holding_cost', 0):,.0f}",
                    f"${stoch.get('demand_penalty', 0):,.0f}"
                ]
            }
            
            df_cost = pd.DataFrame(cost_data)
            st.dataframe(df_cost, use_container_width=True, hide_index=True)
            
            # Performance metrics
            st.write("**Performance Metrics:**")
            perf_data = {
                'Metric': ['Service Level', 'Facility Utilization', 'Unmet Demand'],
                'Deterministic': [
                    f"{det.get('service_level', 0):.1%}",
                    f"{det.get('facility_utilization', 0):.1%}",
                    f"{det.get('unmet_demand', 0):,.0f}"
                ],
                'Stochastic': [
                    f"{stoch.get('service_level', 0):.1%}",
                    f"{stoch.get('facility_utilization', 0):.1%}",
                    f"{stoch.get('unmet_demand', 0):,.0f}"
                ]
            }
            
            df_perf = pd.DataFrame(perf_data)
            st.dataframe(df_perf, use_container_width=True, hide_index=True)
        
        # Scenarios
        if 'scenarios' in results:
            st.subheader("🎲 Generated Scenarios")
            
            scenario_data = []
            for s in results['scenarios']:
                scenario_data.append({
                    'Scenario': s.get('name', 'Unknown'),
                    'Probability': f"{s.get('probability', 0):.2%}",
                    'Demand Multiplier': f"{s.get('demand_multiplier', 1.0):.2f}x",
                    'Description': s.get('description', 'No description')
                })
            
            df_scenarios = pd.DataFrame(scenario_data)
            st.dataframe(df_scenarios, use_container_width=True, hide_index=True)
        
        # Report
        if 'report' in results:
            st.subheader("📄 Analysis Report")
            if isinstance(results['report'], str):
                st.markdown(results['report'])
            else:
                st.info("Report not available")
        
        # Action buttons
        st.subheader("🚀 Next Steps")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔄 Re-run Analysis", type="primary"):
                st.rerun()
        
        with col2:
            if st.button("⚙️ Configure Settings"):
                st.switch_page("Demand Uncertainty Settings")
    
    else:
        st.info("📊 No analysis results found. Please run analysis first.")
        if st.button("🚀 Run Analysis", type="primary"):
            st.rerun()

print("✅ Simplified demand uncertainty analysis UI created successfully")
