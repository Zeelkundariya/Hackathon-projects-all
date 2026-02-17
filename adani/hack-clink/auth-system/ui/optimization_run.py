"""
Ultra-Simple Optimization Run - Bulletproof Implementation
"""

import streamlit as st
import pandas as pd
import traceback

from backend.middleware.role_guard import require_authentication, require_role

def render_optimization_run(role: str) -> None:
    """Render ultra-simple optimization run page."""
    
    if not require_authentication():
        return
    
    if not require_role(["Admin", "Planner"]):
        st.warning("Viewer role: you cannot run optimization. Open Optimization Results to view runs.")
        return
    
    st.header("Run Optimization")
    st.caption("Solve deterministic multi-period clinker allocation and transport planning.")
    
    # Simple configuration
    st.sidebar.header("⚙️ Configuration")
    
    # Simple month selection
    available_months = ["1", "2", "3"]  # Fixed for simplicity
    selected_months = st.sidebar.multiselect("Select planning months", options=available_months, default=["1"])
    
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
    
    # Run optimization button
    if st.button("🚀 Run Optimization", type="primary"):
        with st.spinner("Running optimization..."):
            try:
                st.info("📊 Loading data...")
                
                # Load data with comprehensive error handling
                try:
                    from simple_feasible_loader import load_simple_feasible_data
                    data = load_simple_feasible_data(
                        file_path="Dataset_Dummy_Clinker_3MPlan.xlsx",
                        selected_months=selected_months
                    )
                    st.success(f"✅ Data loaded: {len(data.plant_ids)} plants")
                except Exception as e:
                    st.error(f"❌ Data loading failed: {str(e)}")
                    st.error("🚨 Please check if Dataset_Dummy_Clinker_3MPlan.xlsx exists in the correct location.")
                    return
                
                st.info("🏗️ Building optimization model...")
                
                # Build model with error handling
                try:
                    from simple_feasible_model import build_simple_feasible_model
                    model = build_simple_feasible_model(data)
                    st.success("✅ Model built successfully")
                except Exception as e:
                    st.error(f"❌ Model building failed: {str(e)}")
                    st.error("🚨 Please check model configuration.")
                    return
                
                st.info("⚡ Solving optimization...")
                
                # Solve model with error handling
                try:
                    from backend.optimization.solver import SolverConfig, solve_model
                    outcome = solve_model(
                        model,
                        SolverConfig(
                            solver_name="cbc",
                            time_limit_seconds=int(time_limit),
                            mip_gap=float(mip_gap),
                        ),
                    )
                    
                    if not outcome.ok:
                        st.error(f"❌ Optimization failed: {outcome.message}")
                        st.error("🚨 Please check solver configuration and constraints.")
                        return
                    
                    st.success(f"✅ Optimization completed: {outcome.message}")
                    
                except Exception as e:
                    st.error(f"❌ Solving failed: {str(e)}")
                    st.error("🚨 Please check solver installation and configuration.")
                    return
                
                st.info("📈 Parsing results...")
                
                # Parse results with error handling
                try:
                    from simple_result_parser import parse_simple_results
                    results = parse_simple_results(model, plant_names=data.plant_names)
                    st.success("✅ Results parsed successfully")
                except Exception as e:
                    st.error(f"❌ Result parsing failed: {str(e)}")
                    st.error("🚨 Please check result parser configuration.")
                    return
                
                st.info("💾 Saving results...")
                
                # Save results with error handling
                try:
                    from backend.results.result_service import save_optimization_run
                    ok, msg, run_id = save_optimization_run(
                        created_by_email=str(st.session_state.get("user_email")),
                        months=list(selected_months),
                        solver="cbc",
                        demand_type="Fixed",
                        status="success",
                        message=outcome.message,
                        objective_value=results.objective_value,
                        cost_breakdown=results.cost_breakdown,
                        production_df=results.production_df,
                        transport_df=results.transport_df,
                        inventory_df=results.inventory_df,
                        optimization_type="deterministic",
                    )
                    
                    if ok and run_id:
                        st.session_state.last_optimization_run_id = run_id
                        st.success("✅ Results saved successfully")
                    else:
                        st.warning(f"⚠️ Save warning: {msg}")
                        
                except Exception as e:
                    st.error(f"❌ Save failed: {str(e)}")
                    st.error("🚨 Results may not be saved to database.")
                    # Continue to display results even if save fails
                
                # Display results
                st.divider()
                st.subheader("📊 Optimization Results")
                
                # Display objective value
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Objective value (total cost)", round(results.objective_value, 2))
                with col2:
                    prod_count = len(results.production_df) if hasattr(results.production_df, '__len__') else 0
                    st.metric("Active production plans", prod_count)
                
                # Display cost breakdown
                st.subheader("💰 Cost Breakdown")
                try:
                    cost = results.cost_breakdown
                    cost_df = pd.DataFrame([
                        {"type": "production", "cost": float(cost.get("production", 0.0))},
                        {"type": "transport", "cost": float(cost.get("transport", 0.0))},
                        {"type": "holding", "cost": float(cost.get("holding", 0.0))},
                        {"type": "demand_penalty", "cost": float(cost.get("demand_penalty", 0.0))},
                    ])
                    st.dataframe(cost_df, use_container_width=True)
                except Exception as e:
                    st.warning(f"⚠️ Cost breakdown display issue: {str(e)}")
                
                # Display production plan
                st.subheader("🏭 Production Plan")
                try:
                    if hasattr(results.production_df, 'empty') and not results.production_df.empty:
                        st.dataframe(results.production_df, use_container_width=True)
                    else:
                        st.warning("No production data available")
                except Exception as e:
                    st.warning(f"⚠️ Production plan display issue: {str(e)}")
                
                # Display transport plan
                st.subheader("🚚 Transport Plan")
                try:
                    if hasattr(results.transport_df, 'empty') and not results.transport_df.empty:
                        st.dataframe(results.transport_df, use_container_width=True)
                    else:
                        st.warning("No transport data available")
                except Exception as e:
                    st.warning(f"⚠️ Transport plan display issue: {str(e)}")
                
                # Display inventory plan
                st.subheader("📦 Inventory Plan")
                try:
                    if hasattr(results.inventory_df, 'empty') and not results.inventory_df.empty:
                        st.dataframe(results.inventory_df, use_container_width=True)
                    else:
                        st.warning("No inventory data available")
                except Exception as e:
                    st.warning(f"⚠️ Inventory plan display issue: {str(e)}")
                
                # Success message
                st.success("🎉 Optimization completed successfully!")
                st.info("💡 Open Optimization Results to view and export detailed results.")
                
            except Exception as e:
                st.error(f"❌ Unexpected error: {str(e)}")
                st.error("🚨 Something went wrong. Please try again or contact an administrator.")
                st.code(traceback.format_exc())
                return

print("✅ Optimization run UI module loaded")
