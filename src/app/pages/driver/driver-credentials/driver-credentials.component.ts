import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-driver-credentials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-slate-900">Driver Credentials</h1>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          Compliant
        </span>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            MV
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-900">Marcus Vance</h2>
            <p class="text-xs text-slate-500">ID: DRV-1 • Assigned: Van #4</p>
          </div>
        </div>
      </div>

      <!-- Credential Cards -->
      <div class="space-y-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver License</span>
            <p class="text-sm font-bold text-slate-800">CO Class R #9283741</p>
            <p class="text-xs text-slate-500">Expires: 11/14/2027</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Verified</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">DOT Medical Card</span>
            <p class="text-sm font-bold text-slate-800">FMCSA Certified</p>
            <p class="text-xs text-slate-500">Expires: 12/31/2026</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Active</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Aid / CPR</span>
            <p class="text-sm font-bold text-slate-800">American Red Cross</p>
            <p class="text-xs text-slate-500">Expires: 08/20/2027</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Active</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Pre-Trip DVIR</span>
            <p class="text-sm font-bold text-slate-800">Van #4 Inspection</p>
            <p class="text-xs text-slate-500">Completed today 07:45 AM</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Passed</span>
        </div>
      </div>
    </div>
  `
})
export class DriverCredentialsComponent {}
